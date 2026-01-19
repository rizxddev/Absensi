async function getFileContent(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { 
    headers: { 
      Authorization: `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sistem-Absensi-App'
    } 
  });
  
  if (!res.ok) {
    // Jika file tidak ditemukan, return null (akan dibuat baru)
    if (res.status === 404) return null;
    throw new Error(`Gagal mengambil file: ${res.status}`);
  }
  
  const data = await res.json();
  const decoded = Buffer.from(data.content, 'base64').toString('utf8');
  return { 
    sha: data.sha, 
    content: JSON.parse(decoded),
    size: data.size,
    path: data.path
  };
}

async function commitToGitHub({ owner, repo, path, token, content, sha, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  const body = {
    message,
    content: encoded,
    branch: 'main'
  };

  // Tambahkan sha jika melakukan update (bukan create baru)
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sistem-Absensi-App'
    },
    body: JSON.stringify(body)
  });

  if (res.status === 200 || res.status === 201) {
    const result = await res.json();
    return { 
      success: true, 
      message: 'Disclaimer berhasil disimpan ke GitHub!',
      commitSha: result.commit?.sha,
      contentSha: result.content?.sha,
      url: result.content?.html_url
    };
  }

  const error = await res.json();
  console.error('GitHub API Error:', error);
  return { 
    success: false, 
    error: error.message || 'Gagal menyimpan ke GitHub',
    details: error
  };
}

// Fungsi untuk create commit dengan multiple changes
async function createCommit({ owner, repo, token, changes, message }) {
  try {
    // 1. Get the reference to the main branch
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!refRes.ok) throw new Error('Gagal mengambil referensi branch');
    const refData = await refRes.json();
    
    // 2. Get the current commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${refData.object.sha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!commitRes.ok) throw new Error('Gagal mengambil commit');
    const commitData = await commitRes.json();
    
    // 3. Create a tree with multiple blobs
    const treeItems = [];
    
    for (const change of changes) {
      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: Buffer.from(JSON.stringify(change.content, null, 2)).toString('base64'),
            encoding: 'base64'
          })
        }
      );
      
      if (!blobRes.ok) throw new Error(`Gagal membuat blob untuk ${change.path}`);
      const blobData = await blobRes.json();
      
      treeItems.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }
    
    // 4. Create a new tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: commitData.tree.sha,
          tree: treeItems
        })
      }
    );
    
    if (!treeRes.ok) throw new Error('Gagal membuat tree');
    const treeData = await treeRes.json();
    
    // 5. Create a new commit
    const newCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          tree: treeData.sha,
          parents: [commitData.sha]
        })
      }
    );
    
    if (!newCommitRes.ok) throw new Error('Gagal membuat commit');
    const newCommitData = await newCommitRes.json();
    
    // 6. Update the reference
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: false
        })
      }
    );
    
    if (!updateRefRes.ok) throw new Error('Gagal update reference');
    
    return {
      success: true,
      message: 'Multi-file update berhasil!',
      commitSha: newCommitData.sha,
      treeSha: treeData.sha
    };
    
  } catch (error) {
    console.error('Create commit error:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Hanya method POST yang diizinkan' 
    });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;

  // Validasi environment variables
  if (!GITHUB_TOKEN || !OWNER || !REPO) {
    console.error('Environment variables missing:', {
      hasToken: !!GITHUB_TOKEN,
      hasOwner: !!OWNER,
      hasRepo: !!REPO
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Konfigurasi GitHub tidak lengkap. Periksa environment variables.' 
    });
  }

  try {
    const { 
      disclaimer_text, 
      notification_text, 
      action = 'single' // 'single' untuk disclaimer saja, 'multiple' untuk semua
    } = req.body;

    // Validasi input
    if (!disclaimer_text && action === 'single') {
      return res.status(400).json({ 
        success: false, 
        error: 'Teks disclaimer diperlukan' 
      });
    }

    let result;
    
    if (action === 'multiple') {
      // Update multiple files: disclaimer dan notifikasi
      const changes = [];
      
      // 1. Update disclaimer
      if (disclaimer_text !== undefined) {
        const disclaimerFile = await getFileContent(
          OWNER, 
          REPO, 
          'public/data/disclaimer.json', 
          GITHUB_TOKEN
        );
        
        const disclaimerContent = disclaimerFile?.content || {
          id: 'disclaimer',
          text: disclaimer_text,
          last_updated: new Date().toISOString(),
          updated_by: 'admin',
          version: 1
        };
        
        // Update content
        disclaimerContent.text = disclaimer_text;
        disclaimerContent.last_updated = new Date().toISOString();
        disclaimerContent.version = (disclaimerContent.version || 0) + 1;
        
        changes.push({
          path: 'public/data/disclaimer.json',
          content: disclaimerContent,
          sha: disclaimerFile?.sha
        });
      }
      
      // 2. Update notification texts
      if (notification_text) {
        const notificationsFile = await getFileContent(
          OWNER, 
          REPO, 
          'public/data/notifications.json', 
          GITHUB_TOKEN
        );
        
        const notificationsContent = notificationsFile?.content || {
          id: 'notifications',
          copy_success: 'Hasil absensi berhasil disalin!',
          save_success: 'Data berhasil disimpan!',
          error: 'Terjadi kesalahan',
          last_updated: new Date().toISOString(),
          version: 1
        };
        
        // Merge dengan input
        Object.assign(notificationsContent, notification_text);
        notificationsContent.last_updated = new Date().toISOString();
        notificationsContent.version = (notificationsContent.version || 0) + 1;
        
        changes.push({
          path: 'public/data/notifications.json',
          content: notificationsContent,
          sha: notificationsFile?.sha
        });
      }
      
      // Commit all changes
      if (changes.length > 0) {
        result = await createCommit({
          owner: OWNER,
          repo: REPO,
          token: GITHUB_TOKEN,
          changes,
          message: 'Update disclaimer dan notifikasi dari Sistem Absensi'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Tidak ada data untuk diupdate'
        });
      }
      
    } else {
      // Single file update: hanya disclaimer
      const disclaimerFile = await getFileContent(
        OWNER, 
        REPO, 
        'public/data/disclaimer.json', 
        GITHUB_TOKEN
      );
      
      let disclaimerContent;
      let sha = null;
      
      if (disclaimerFile) {
        // Update existing file
        disclaimerContent = disclaimerFile.content;
        sha = disclaimerFile.sha;
        
        disclaimerContent.text = disclaimer_text;
        disclaimerContent.last_updated = new Date().toISOString();
        disclaimerContent.version = (disclaimerContent.version || 0) + 1;
      } else {
        // Create new file
        disclaimerContent = {
          id: 'disclaimer',
          text: disclaimer_text,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          updated_by: 'admin',
          version: 1,
          metadata: {
            type: 'warning',
            priority: 'high',
            show_on_load: true
          }
        };
      }
      
      result = await commitToGitHub({
        owner: OWNER,
        repo: REPO,
        path: 'public/data/disclaimer.json',
        token: GITHUB_TOKEN,
        content: disclaimerContent,
        sha,
        message: 'Update disclaimer dari Sistem Absensi'
      });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          commit_sha: result.commitSha,
          content_sha: result.contentSha,
          url: result.url,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
    
  } catch (err) {
    console.error('Update disclaimer error:', err);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Helper function untuk backup (opsional)
async function createBackup(owner, repo, token, originalContent, backupPath) {
  try {
    const backupContent = {
      ...originalContent,
      backup_timestamp: new Date().toISOString(),
      original_path: 'public/data/disclaimer.json'
    };
    
    const backupResult = await commitToGitHub({
      owner,
      repo,
      path: backupPath,
      token,
      content: backupContent,
      sha: null, // Create new
      message: `Backup disclaimer sebelum update - ${new Date().toISOString()}`
    });
    
    return backupResult;
  } catch (error) {
    console.error('Backup failed:', error);
    return null;
  }
}

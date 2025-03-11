document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const clipName = document.getElementById('clipName').value;
    const authorName = document.getElementById('authorName').value;
    const clipDescription = document.getElementById('clipDescription').value;
    const clipFile = document.getElementById('clipFile').files[0];
  
    const formData = new FormData();
    formData.append('clipName', clipName);
    formData.append('authorName', authorName);
    formData.append('clipDescription', clipDescription);
    formData.append('clipFile', clipFile);
  
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
        document.getElementById('status').innerHTML = `
        ${result.message}<br>
        <a href="${result.clipPageUrl}" target="_blank">View Clip Page</a>
        `;
    } catch (error) {
      document.getElementById('status').textContent = 'Upload failed!';
    }
  });
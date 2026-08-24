const fs = require('fs');
fetch('http://localhost:3000/api/ai/scan-receipt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgJCglKDRYUDQwMDRsYFxgZHR0bHR0aHR0cISAhHR8jIR0cIykjJCUqKysrHR8tMy0tLTMuKisBCgoKDQwNFA0NFCsZGRkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAB4AHgMBIgACEQEDEQH/xAAYAAADAQEAAAAAAAAAAAAAAAAAAwQCBf/EAB4QAQACAgIDAQAAAAAAAAAAAAABAgMREiEEMUHx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AMr1T2wzR3x06o9GAAAN3/2Q==',
    mimeType: 'image/jpeg'
  })
}).then(r=>r.json()).then(console.log).catch(console.error);

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'ddnhp0hzd',
  api_key: '621593622313499',
  api_secret: '8L6DFx3A7ixe91kNTuLdglR1Q-g'
});

async function uploadLogo() {
  // Look for the logo image in the artifacts directory - saved from user upload
  const candidates = [
    '/Users/onnleon/.gemini/antigravity/brain/cfd84c03-eb80-4d33-866f-96fbe0f77b86/gasclub247_logo_transparent_1775064675898.png',
    path.join(__dirname, '../public/gasclub-logo.png'),
    path.join(__dirname, '../public/logo.png'),
  ];

  let logoPath = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { logoPath = c; break; }
  }

  if (!logoPath) {
    console.log('Logo file not found. Checked:');
    candidates.forEach(c => console.log(' -', c));
    return;
  }

  console.log('Uploading logo from:', logoPath);

  try {
    const result = await cloudinary.uploader.upload(logoPath, {
      public_id: 'gasclub247/brand/gasclub247-logo-main',
      overwrite: true,
      resource_type: 'image',
    });
    console.log('SUCCESS!');
    console.log('URL:', result.secure_url);
    console.log('Size:', result.width + 'x' + result.height);
    console.log('Format:', result.format);
  } catch (err) {
    console.error('Upload error:', err.message);
  }
}

uploadLogo();

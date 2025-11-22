const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_tennis_tournament',
    user: process.env.DB_USER || 'leonidtkach',
    password: process.env.DB_PASSWORD || '',
});

// Try to import Canvas - if not available, we'll use a simpler approach
let createCanvas;
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
} catch (err) {
    console.log('⚠️  Canvas module not found. Will create simple placeholder files.');
    createCanvas = null;
}

// Generate tournament image (matching frontend logic)
function generateTournamentImage(tournamentId, width = 800, height = 600) {
    if (!createCanvas) {
        // Fallback: create a simple text file as placeholder
        return Buffer.from(`Tournament ${tournamentId} - Default Image Placeholder`);
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Gradients matching frontend
    const gradients = [
        { start: '#667eea', end: '#764ba2' }, // Purple-Blue
        { start: '#f093fb', end: '#f5576c' }, // Pink-Red
        { start: '#4facfe', end: '#00f2fe' }, // Blue-Cyan
        { start: '#43e97b', end: '#38f9d7' }, // Green-Turquoise
        { start: '#fa709a', end: '#fee140' }, // Pink-Yellow
        { start: '#30cfd0', end: '#330867' }, // Cyan-Purple
        { start: '#a8edea', end: '#fed6e3' }, // Turquoise-Pink
        { start: '#ff9a9e', end: '#fecfef' }, // Coral-Pink
        { start: '#fa8bff', end: '#2bd2ff' }, // Bright Purple-Blue
        { start: '#ff6e7f', end: '#bfe9ff' }, // Coral-Blue
        { start: '#fad961', end: '#f76b1c' }, // Golden-Orange
        { start: '#8360c3', end: '#2ebf91' }, // Purple-Green
        { start: '#ee0979', end: '#ff6a00' }, // Deep Pink-Orange
        { start: '#00c9ff', end: '#92fe9d' }, // Bright Cyan-Green
        { start: '#fbc2eb', end: '#a6c1ee' }, // Soft Pink-Blue
        { start: '#a1c4fd', end: '#c2e9fb' }, // Light Blue
    ];

    const gradient = gradients[tournamentId % gradients.length];

    // Create linear gradient
    const linearGradient = ctx.createLinearGradient(0, 0, width, height);
    linearGradient.addColorStop(0, gradient.start);
    linearGradient.addColorStop(1, gradient.end);

    // Fill background with gradient
    ctx.fillStyle = linearGradient;
    ctx.fillRect(0, 0, width, height);

    // Add pattern overlay (dots)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    const dotSpacing = 80;
    const dotRadius = 5;
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x + dotSpacing / 2, y + dotSpacing / 2, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw logo (simplified - just white circles for racket/ball representation)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    // Large racket representation (oval)
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, 150, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball representation
    ctx.beginPath();
    ctx.arc(width / 2 + 80, height / 2 - 80, 30, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toBuffer('image/png');
}

async function generateDefaultImages() {
    try {
        console.log('🖼️  Generating default images for tournaments without images...\n');

        // Find tournaments without images
        const result = await pool.query(`
      SELECT id, name, image_url
      FROM tournaments
      WHERE image_url IS NULL OR image_url = '' OR image_url = 'null'
      ORDER BY id
    `);

        if (result.rows.length === 0) {
            console.log('✅ All tournaments already have images!');
            return;
        }

        console.log(`Found ${result.rows.length} tournament(s) without images:\n`);
        result.rows.forEach(t => {
            console.log(`   - ID ${t.id}: ${t.name}`);
        });
        console.log('');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../uploads/tournaments');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        let successCount = 0;
        let failCount = 0;

        for (const tournament of result.rows) {
            try {
                console.log(`\n📸 Generating image for: ${tournament.name} (ID: ${tournament.id})`);

                // Generate image
                const imageBuffer = generateTournamentImage(tournament.id);

                // Save to uploads directory
                const filename = `tournament-${tournament.id}-default-${Date.now()}.png`;
                const filepath = path.join(uploadsDir, filename);
                fs.writeFileSync(filepath, imageBuffer);

                console.log(`   ✓ Image generated: ${filename}`);

                // Update database with relative path
                const imageUrl = `/uploads/tournaments/${filename}`;
                await pool.query(`
          UPDATE tournaments
          SET image_url = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [imageUrl, tournament.id]);

                console.log(`   ✓ Database updated with image URL: ${imageUrl}`);
                successCount++;

            } catch (err) {
                console.error(`   ✗ Error processing tournament ${tournament.id}:`, err.message);
                failCount++;
            }
        }

        console.log('\n' + '─'.repeat(80));
        console.log(`\n✅ Complete! Generated ${successCount} image(s)`);
        if (failCount > 0) {
            console.log(`⚠️  Failed: ${failCount} image(s)`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
generateDefaultImages();

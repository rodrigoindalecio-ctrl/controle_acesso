const fs = require('fs');
const path = require('path');

try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');

    const envLocal = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envLocal.split(/\r?\n/);
    const dbUrlLine = lines.find(l => l.trim().startsWith('DATABASE_URL='));

    if (dbUrlLine) {
        let url = dbUrlLine.split('=')[1].trim();
        // Remove quotes if present
        if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
            url = url.slice(1, -1);
        }

        fs.writeFileSync(envPath, `DATABASE_URL="${url}"\n`);
        console.log('Successfully updated .env with DATABASE_URL from .env.local');
    } else {
        console.error('DATABASE_URL not found in .env.local');
        process.exit(1);
    }
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}

const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');

const packagePath = path.resolve(__dirname, '..', 'electron', 'package.json')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const versionRegex = /^v(\d+\.)?(\d+\.)?(\*|\d+)$/;

console.log('echo "Recent git tag: "')
exec('git tag -l --sort=v:refname', (err, stdout, stderr) => {
    if (err) {
        console.error(`Error echo recent tag: ${err}`);
        return rl.close();
    }
    let lines = stdout.split('\n')
    const lastFiveLines = lines.length > 5 ? lines.slice(lines.length - 5) : lines;
    lastFiveLines.forEach(line => console.log(line));

    rl.question('Enter the new version (must follow semantic versioning e.g., v1.0.0): ', (newVersion) => {
        if (!versionRegex.test(newVersion)) {
            console.error('Error: Version format is invalid. Please follow semantic versioning (e.g., 1.0.0).');
            return rl.close();
        }

        fs.readFile(packagePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return rl.close();
            }

            const packageJson = JSON.parse(data);
            packageJson.version = newVersion;

            fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8', (err) => {
                if (err) {
                    console.error(err);
                    return rl.close();
                }
                console.log(`package.json version updated to ${newVersion}`);

                exec(`git add ${packagePath} && git commit -m "Update version to ${newVersion}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Error creating git commit: ${err}`);
                        return rl.close();
                    }
                    console.log(`Git commit for version update created`);

                    exec(`git tag ${newVersion}`, (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Error creating git tag: ${err}`);
                            return rl.close();
                        }
                        console.log(`Git tag ${newVersion} added`);

                        // exec(`git push && git push --all`, (err, stdout, stderr) => {
                        //     if (err) {
                        //         console.error(`Error pushing changes and tag to remote: ${err}`);
                        //         return rl.close();
                        //     }
                        //     console.log(`Changes and tag ${newVersion} pushed to remote`);
                        //     rl.close();
                        // });
                        process.exit(0);
                    });
                });
            });
        });
    });
})

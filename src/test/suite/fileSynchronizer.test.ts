import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileSynchronizer } from '../../fileSynchronizer';

suite('FileSynchronizer Test Suite', () => {
    let tmpDir: string;
    let pathA: string;
    let pathB: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivemind-unit-'));
        pathA = path.join(tmpDir, 'fileA.json');
        pathB = path.join(tmpDir, 'fileB.json');
    });

    teardown(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('Syncs A to B when A changes', async () => {
        fs.writeFileSync(pathA, 'initial');
        fs.writeFileSync(pathB, 'different');

        const syncer = new FileSynchronizer(pathA, pathB, 'Test');
        syncer.start();

        // Simulate change in A
        fs.writeFileSync(pathA, 'updated');

        // Wait for debounce (100ms) + small buffer
        await new Promise(r => setTimeout(r, 1000));

        const contentB = fs.readFileSync(pathB, 'utf8');
        assert.strictEqual(contentB, 'updated');
        syncer.stop();
    });

    test('Syncs B to A when B changes', async () => {
        fs.writeFileSync(pathA, 'different');
        fs.writeFileSync(pathB, 'initial');

        const syncer = new FileSynchronizer(pathA, pathB, 'Test');
        syncer.start();

        // Simulate change in B
        fs.writeFileSync(pathB, 'updated');

        // Wait for debounce
        await new Promise(r => setTimeout(r, 1000));

        const contentA = fs.readFileSync(pathA, 'utf8');
        assert.strictEqual(contentA, 'updated');
        syncer.stop();
    });

    test('Force sync functions', async () => {
        fs.writeFileSync(pathA, 'source');
        fs.writeFileSync(pathB, 'target');

        const syncer = new FileSynchronizer(pathA, pathB, 'Test');
        await syncer.forceSyncFromTo(pathA, pathB);

        const contentB = fs.readFileSync(pathB, 'utf8');
        assert.strictEqual(contentB, 'source');
    });
});

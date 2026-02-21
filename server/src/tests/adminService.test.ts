import * as assert from 'assert';
import {
    getSystemSettings,
    updateSystemSetting,
    getBlockedIPs,
    blockIP,
    unblockIP,
    isIPBlocked,
    getAuditLogs,
    logAdminAction,
    getRecentUsers,
    getContentStats,
    getSystemHealth,
    getFullUserList,
    getNewsletterSubscribers
} from '../services/adminService';

// We need to connect to the DB. Ensure `../db` connects successfully in ts-node context.
// Load env vars
import dotenv from 'dotenv';
dotenv.config();

const testAdminId = 'user_test_admin_req';
const testIp = '192.168.1.99';

async function runTests() {
    console.log('Starting Admin Service Tests...');
    let passed = 0;
    let failed = 0;

    const runTest = async (name: string, fn: () => Promise<void>) => {
        try {
            await fn();
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } catch (error: any) {
            console.error(`❌ [FAIL] ${name}`);
            console.error(`   Error: ${error.message}`);
            failed++;
        }
    };

    // 1. Settings Tests
    await runTest('System Settings: Retrieve, Update, and Verify', async () => {
        const testKey = 'test_setting_key';
        const testValue = { enabled: true, count: 42 };

        await updateSystemSetting(testKey, testValue, testAdminId);
        const settings = await getSystemSettings();

        const ourSetting = settings.find(s => s.key === testKey);
        assert.ok(ourSetting, 'Setting should be saved and retrieved');
        assert.deepStrictEqual(ourSetting.value, testValue, 'Setting value should match');
    });

    // 2. IP Blocking Tests
    await runTest('IP Blocking: Block, Check, Retrieve, and Unblock', async () => {
        const reason = 'test_abuse';

        // Block
        await blockIP(testIp, reason, testAdminId);

        // Check
        const isBlocked = await isIPBlocked(testIp);
        assert.strictEqual(isBlocked, true, 'IP should be blocked');

        // Retrieve
        const blockedIpsList = await getBlockedIPs();
        const ourBlockedIp = blockedIpsList.find(b => b.ip === testIp);
        assert.ok(ourBlockedIp, 'Blocked IP should appear in list');
        assert.strictEqual(ourBlockedIp.reason, reason, 'Block reason should match');

        // Unblock
        await unblockIP(testIp, testAdminId);
        const isBlockedAfter = await isIPBlocked(testIp);
        assert.strictEqual(isBlockedAfter, false, 'IP should be unblocked');
    });

    // 3. Audit Logs Tests
    await runTest('Audit Logs: Log action and retrieve', async () => {
        const testAction = 'test_action_run';
        const testTarget = 'test_target_id';
        const testDetails = { test_run_id: Date.now() };

        await logAdminAction(testAdminId, testAction, testTarget, testDetails);

        const logs = await getAuditLogs(20);
        const ourLog = logs.find(l => l.admin_id === testAdminId && l.action === testAction && l.target_id === testTarget);

        assert.ok(ourLog, 'Audit log should be retrieved');
        assert.deepStrictEqual(ourLog.details, testDetails, 'Log details should match');
    });

    // 4. Stats & Health Tests
    await runTest('Stats & Health: System Health Check', async () => {
        const health = await getSystemHealth();
        assert.ok(['healthy', 'unhealthy'].includes(health.status), 'Health status should be healthy or unhealthy');
        assert.ok(health.timestamp, 'Health should have a timestamp');
        assert.ok(typeof health.uptime === 'number', 'Uptime should be a number');
    });

    await runTest('Stats & Health: Content Stats', async () => {
        const stats = await getContentStats();
        assert.ok(typeof stats.articles.published === 'number');
        assert.ok(typeof stats.articles.drafts === 'number');
        assert.ok(typeof stats.newsletterSubscribers === 'number');
    });

    await runTest('Stats & Health: Recent & Full User Lists', async () => {
        const recentUsers = await getRecentUsers(5);
        assert.ok(Array.isArray(recentUsers), 'Recent users should be an array');
        if (recentUsers.length > 0) {
            assert.ok(recentUsers[0].email, 'User object should have an email');
        }

        const fullUsers = await getFullUserList();
        assert.ok(Array.isArray(fullUsers), 'Full user list should be an array');
    });

    await runTest('Newsletter: Retrieve Subscribers', async () => {
        const subscribers = await getNewsletterSubscribers();
        assert.ok(Array.isArray(subscribers), 'Subscribers should be an array');
    });

    console.log('\n--- Test Summary ---');
    console.log(`Total:  ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    } else {
        console.log('\n🎉 All admin feature tests passed successfully!');
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
});

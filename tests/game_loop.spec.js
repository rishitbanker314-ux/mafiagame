const { test, expect } = require('@playwright/test');

test.describe('Mafia Game Loop', () => {
  let ctxA, ctxB, ctxC, ctxD;
  let pageA, pageB, pageC, pageD;

  test.beforeAll(async ({ browser }) => {
    // Create 4 isolated browser contexts
    ctxA = await browser.newContext();
    ctxB = await browser.newContext();
    ctxC = await browser.newContext();
    ctxD = await browser.newContext();

    pageA = await ctxA.newPage();
    pageB = await ctxB.newPage();
    pageC = await ctxC.newPage();
    pageD = await ctxD.newPage();
  });

  test.afterAll(async () => {
    await ctxA.close();
    await ctxB.close();
    await ctxC.close();
    await ctxD.close();
  });

  test('4-player full game loop integration', async () => {
    test.setTimeout(60000); // Increase test timeout to 60s
    // 1. Lobby Phase
    // Player A (Host) creates the room
    await pageA.goto('http://localhost:5173');
    await pageA.fill('input[placeholder="Enter your name..."]', 'Player A');
    await pageA.click('button:has-text("Create New Room")');

    // Wait for room code to appear
    await pageA.waitForSelector('text=Room Code');
    const roomCode = await pageA.locator('span.text-4xl').innerText();
    expect(roomCode.trim().length).toBe(4);

    // Player B joins
    await pageB.goto('http://localhost:5173');
    await pageB.fill('input[placeholder="Enter your name..."]', 'Player B');
    await pageB.fill('input[placeholder="ABCD"]', roomCode);
    await pageB.click('button:has-text("Join Room")');

    // Player C joins
    await pageC.goto('http://localhost:5173');
    await pageC.fill('input[placeholder="Enter your name..."]', 'Player C');
    await pageC.fill('input[placeholder="ABCD"]', roomCode);
    await pageC.click('button:has-text("Join Room")');

    // Player D joins
    await pageD.goto('http://localhost:5173');
    await pageD.fill('input[placeholder="Enter your name..."]', 'Player D');
    await pageD.fill('input[placeholder="ABCD"]', roomCode);
    await pageD.click('button:has-text("Join Room")');

    // Assert all 4 names are in Player D's DOM (they wait for update_lobby)
    await pageD.waitForSelector('text=Player A');
    await pageD.waitForSelector('text=Player B');
    await pageD.waitForSelector('text=Player C');
    await pageD.waitForSelector('text=Player D');

    // 2. Game Start
    // Player A clicks Start Game
    await pageA.click('button:has-text("Start Game")');

    // Assert all 4 pages transition to Night Phase UI
    const pages = [pageA, pageB, pageC, pageD];
    for (const p of pages) {
      await p.waitForSelector('text=Night Phase');
      // Wait for roles to render
      await p.waitForSelector('h2.text-3xl');
    }

    // Determine the roles assigned
    const playersInfo = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const name = String.fromCharCode(65 + i); // A, B, C, D
      const roleName = await p.locator('h2.text-3xl').innerText();
      playersInfo.push({ name: `Player ${name}`, page: p, roleName });
    }

    // 3. Night Phase Execution
    // Find who has active roles (Mafia, Doctor, Vigilante have night actions)
    for (const info of playersInfo) {
      const p = info.page;
      const targetButtons = await p.locator('button.btn-target').all();
      
      // If there are target buttons, it's an active role. Click the first target.
      if (targetButtons.length > 0) {
        await targetButtons[0].click();
      }
    }

    // Assert transition to Day Phase
    for (const p of pages) {
      await p.waitForSelector('text=☀️ Day Phase', { timeout: 10000 });
    }

    // 4. Day Phase Voting
    // Find who is alive
    const alivePages = [];
    const deadPages = [];
    let targetName = null;
    
    for (const info of playersInfo) {
      const p = info.page;
      // If we see "You are dead. You cannot vote." then they are dead
      const isDead = await p.isVisible('text="You are dead. You cannot vote."');
      if (isDead) {
        deadPages.push(info);
      } else {
        alivePages.push(info);
        if (!targetName) {
          targetName = info.name; // Pick the first alive person as the target
        }
      }
    }
    
    // Have all other alive players vote for targetName
    for (const info of alivePages) {
      if (info.name !== targetName) {
        await info.page.click(`button:has-text("${targetName}")`);
      }
    }

    // Assert transition to Night Phase or Game Over
    // We just wait for either 'Night Phase' or 'Role Reveal' (Game Over) on pageB
    
    await pageB.waitForSelector('h2:has-text("Role Reveal"), p:has-text("Night Phase")', { timeout: 15000 });

    const text = await pageB.content();
    if (text.includes('Role Reveal')) {
      console.log('Game Over reached!');
    } else {
      console.log('Returned to Night Phase!');
    }
  });
});

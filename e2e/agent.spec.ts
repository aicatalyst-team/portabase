import {expect, test} from "@playwright/test";
import {create, edit, get, launch, remove} from "./helpers/agent";
import {LOCAL_STORAGE_PATH} from "./helpers/session";

const agent = {
    aName: "Agent A",
    aUpdatedName: "Agent A Updated",
    bName: "Agent B",
    description: "Agent created by Playwright E2E",
    updatedDescription: "Agent updated by Playwright E2E",
};

test.use({storageState: LOCAL_STORAGE_PATH});

test.describe.serial(() => {
    let agentWorkspace: string | null = null;

    test("Create agent A from empty state", async ({page}) => {
        await page.goto("/dashboard/agents");
        await expect(page.getByRole("heading", {name: "Agents"})).toBeVisible();
        await expect(page.getByText("Create new Agent", {exact: true})).toBeVisible();
        await create(page, "emptyState", agent.aName, agent.description);

        await expect(page.getByText("Success creating agent")).toBeVisible();
        await expect(get(page, agent.aName)).toBeVisible();
        await expect(page.getByText("Create new Agent", {exact: true})).toHaveCount(0);
    });

    test("Edit agent A", async ({page}) => {
        await page.goto("/dashboard/agents");
        await expect(page.getByRole("heading", {name: "Agents"})).toBeVisible();
        await expect(get(page, agent.aName)).toBeVisible();

        await edit(page, agent.aName, agent.aUpdatedName, agent.updatedDescription);

        await expect(page.getByText("Success updating agent")).toBeVisible();
        await expect(page.getByText(agent.aUpdatedName, {exact: true})).toBeVisible();
        await expect(page.getByText(agent.updatedDescription, {exact: true})).toBeVisible();
    });

    test("Create agent B from classic button", async ({page}) => {
        await page.goto("/dashboard/agents");
        await expect(page.getByRole("heading", {name: "Agents"})).toBeVisible();
        await expect(page.getByRole("button", {name: /Create Agent/i})).toBeVisible();
        await create(page, "button", agent.bName, agent.description);

        await expect(page.getByText("Success creating agent")).toBeVisible();
        await expect(get(page, agent.bName)).toBeVisible();
    });

    test("Delete Agent B", async ({page}) => {
        await page.goto("/dashboard/agents");
        await expect(page.getByRole("heading", {name: "Agents"})).toBeVisible();
        await expect(get(page, agent.bName)).toBeVisible();
        await remove(page, agent.bName);

        await expect(page.getByText("Agent has been successfully deleted.")).toBeVisible();
        await expect(page).toHaveURL("/dashboard/agents");
        await expect(page.getByText(agent.bName)).toHaveCount(0);
    });

    test("Launch the updated agent", async ({page}) => {
        await page.goto("/dashboard/agents");
        await expect(page.getByRole("heading", {name: "Agents"})).toBeVisible();
        await get(page, agent.aName).click();

        await expect(page).toHaveURL(/\/dashboard\/agents\/.+/);
        await expect(page.getByText(agent.aUpdatedName, {exact: true})).toBeVisible();
        await expect(page.getByText("Registration & Setup")).toBeVisible();

        const commandInput = page.locator("input[readonly]").last();
        await page.locator("input[readonly]").first().locator("xpath=following-sibling::button[1]").click();
        const edgeKey = await commandInput.inputValue();

        await launch(edgeKey)

        await expect(page.getByRole("heading", { name: "Managed Databases" })).toBeVisible();
    });
});
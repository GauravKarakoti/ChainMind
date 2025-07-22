const { callNoditApi } = require('./apiCaller');
const { normalizeResponseData } = require('./dataNormalizer');

/**
 * Processes a workflow by executing all its API call steps in parallel.
 * @param {object} workflow - The workflow object containing an array of steps.
 * @returns {Promise<Array>} A promise that resolves to an array of result objects for the frontend.
 */
async function processWorkflow(workflow) {
    const { steps } = workflow;
    if (!steps || !Array.isArray(steps)) {
        throw new Error('Invalid workflow: Steps must be an array.');
    }

    const promises = steps.map(async (step) => {
        if (step.type !== 'api' || !step.details || !step.details.api) {
            return { success: false, error: 'Invalid step in workflow.', details: step };
        }

        const { api, params, chain } = step.details;

        try {
            // 1. Call the appropriate API endpoint
            const rawData = await callNoditApi(api, params, chain);

            // 2. Normalize the raw data into a consistent format for the dashboard
            const normalizedData = normalizeResponseData(api, chain, rawData);

            // 3. Return the complete, structured payload for the frontend
            return {
                success: true,
                api,
                chain,
                data: rawData, // Include raw data for any potential debugging
                normalizedData, // The crucial structured data for rendering
            };
        } catch (error) {
            return {
                success: false,
                error: `API call failed for ${api}`,
                details: error.message,
                api,
                params,
                chain,
            };
        }
    });

    return Promise.all(promises);
}

module.exports = { processWorkflow };
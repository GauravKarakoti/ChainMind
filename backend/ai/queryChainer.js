async function processQueryChain(steps, context = {}) {
  const results = [];
  
  for (const step of steps) {
    const stepResult = await executeStep(step, context);
    results.push(stepResult);
    
    // Update context for next steps
    context = { ...context, ...stepResult.context };
  }
  
  return { results, finalContext: context };
}

async function executeStep(step, context) {
  if (step.api) {
    return executeApiStep(step, context);
  } else if (step.analysis) {
    return executeAnalysisStep(step, context);
  }
}

async function executeApiStep(step, context) {
  // Resolve templated parameters using context
  const resolvedParams = resolveTemplates(step.params, context);
  const result = await callNoditApi(step.api, resolvedParams, step.chain);
  
  return {
    data: result,
    context: {
      [step.outputVar]: result
    }
  };
}

function resolveTemplates(params, context) {
  // Replace {{variable}} with context values
}

module.exports = { processQueryChain }
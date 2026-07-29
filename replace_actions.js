const fs = require('fs');
const path = require('path');
const yaml = require('yaml'); // Requires yaml v2

const directoryPath = '/Users/sharique/Desktop/Workbench/automation-specifications/config/flows/ELECTRONICS';
const sourceFileName = 'Delivery_Flow.yaml';
const sourceFilePath = path.join(directoryPath, sourceFileName);

function processFiles() {
  try {
    const sourceString = fs.readFileSync(sourceFilePath, 'utf8');
    const sourceDoc = yaml.parseDocument(sourceString, { keepSourceTokens: true });
    
    // Map action_id to its exact string representation
    const actionBlocks = new Map();
    const sourceSteps = sourceDoc.get('steps');
    if (!sourceSteps || !sourceSteps.items) {
      console.log('No steps found in source file.');
      return;
    }
    
    for (const stepNode of sourceSteps.items) {
      if (!stepNode || !stepNode.get) continue;
      const actionId = stepNode.get('action_id');
      if (actionId) {
        // range is [start, end, ...]
        const start = stepNode.range[0];
        const end = stepNode.range[1];
        const blockString = sourceString.substring(start, end);
        actionBlocks.set(actionId, blockString);
        console.log(`Mapped action: ${actionId}`);
      }
    }

    // Process all other yaml files
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      if (file === sourceFileName || !file.endsWith('.yaml')) continue;
      
      const filePath = path.join(directoryPath, file);
      const targetString = fs.readFileSync(filePath, 'utf8');
      
      let targetDoc;
      try {
        targetDoc = yaml.parseDocument(targetString, { keepSourceTokens: true });
      } catch (e) {
        console.log(`Error parsing ${file}: ${e.message}`);
        continue;
      }
      
      const targetSteps = targetDoc.get('steps');
      if (!targetSteps || !targetSteps.items) continue;
      
      // We must replace from bottom to top (reverse order) so that string indices don't shift for earlier elements
      let modifiedString = targetString;
      let fileModified = false;
      
      // Filter out null/undefined items and get their ranges
      const validSteps = [];
      for (const stepNode of targetSteps.items) {
        if (!stepNode || !stepNode.get) continue;
        const actionId = stepNode.get('action_id');
        if (actionId && actionBlocks.has(actionId) && stepNode.range) {
           validSteps.push({
             actionId,
             start: stepNode.range[0],
             end: stepNode.range[1]
           });
        }
      }
      
      // Sort in reverse order by start index
      validSteps.sort((a, b) => b.start - a.start);
      
      for (const { actionId, start, end } of validSteps) {
        const replacement = actionBlocks.get(actionId);
        modifiedString = modifiedString.substring(0, start) + replacement + modifiedString.substring(end);
        fileModified = true;
      }
      
      if (fileModified) {
        fs.writeFileSync(filePath, modifiedString, 'utf8');
        console.log(`Updated file: ${file}`);
      }
    }
    
    console.log('Finished updating flows.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

processFiles();

import { execSync } from 'child_process';

let apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  try {
    apiKey = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'LINEAR_API_KEY\', \'User\')"').toString().trim();
  } catch (e) {}
}

async function gql(query, variables) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

async function setStatus(issueKey, statusNameOrType) {
  const r1 = await gql(`{ issue(id: "${issueKey}") { id identifier title team { states { nodes { id name type } } } } }`);
  const issue = r1.data.issue;
  const targetState = issue.team.states.nodes.find(s => 
    s.type.toLowerCase() === statusNameOrType.toLowerCase() || 
    s.name.toLowerCase().includes(statusNameOrType.toLowerCase())
  );

  if (!targetState) {
    throw new Error(`State ${statusNameOrType} not found`);
  }
  
  const r2 = await gql(`mutation($id: String!, $stateId: String!) { 
    issueUpdate(id: $id, input: { stateId: $stateId }) { 
      success 
      issue { 
        identifier 
        title 
        state { name } 
      } 
    } 
  }`, {
    id: issue.id,
    stateId: targetState.id
  });

  console.log('✅ Updated Issue:', r2.data.issueUpdate.issue);
}

const issueKey = process.argv[2] || 'IFE-21';
const status = process.argv[3] || 'started';
setStatus(issueKey, status).catch(console.error);

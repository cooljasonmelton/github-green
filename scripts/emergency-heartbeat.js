import { updateEmergencyHeartbeat } from '../src/emergency-heartbeat.js';

const [date] = process.argv.slice(2);
const status = await updateEmergencyHeartbeat({ date });

console.log(JSON.stringify(status, null, 2));

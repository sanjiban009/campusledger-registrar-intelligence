import { readFile } from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Pass the path to dataset.js and the output .xlsx path.');
const source = await readFile(input,'utf8');
const data = JSON.parse(source.trim().slice('window.CAMPUS_DATA = '.length,-1));
const workbook = Workbook.create();
function tab(name, rows) {
  const sheet = workbook.worksheets.add(name);
  const cols = rows[0].length;
  const table = sheet.getRangeByIndexes(0,0,rows.length,cols);
  table.values = rows;
  const headers = sheet.getRangeByIndexes(0,0,1,cols);
  headers.format.fill = '#173B4B';
  headers.format.font.color = '#FFFFFF';
  headers.format.font.bold = true;
  table.format.columnWidth = 21;
  sheet.freezePanes.freezeRows(1);
  return sheet;
}
const notes = tab('Read me',[
  ['Field','Description'],
  ['Data origin','Synthetic university dataset. No real student records.'],
  ['Observation start',data.start],
  ['Snapshot cutoff',data.cutoff],
  ['Financial year','1 April to 31 March.'],
  ['Service SLA','Monday to Friday, excluding opening day. Holidays are omitted.'],
  ['Future state dates','Synthetic workflow dates after the cutoff represent events outside the observable dashboard period.'],
  ['Request timeline','Verification and Approval are entry dates for each stage. Closed is the completion date.'],
  ['Milestone baseline','Cleared is the count cleared at baseline; the demo assumes all remaining items clear on the completion date.'],
  ['Admissions seat allocation','District and month allocations are additive demo allocations.'],
  ['Peer evidence','Institutions, fees and brochure observations are simulated.'],
  ['Refresh','The dashboard reads dataset.js. Editing the workbook does not automatically refresh the site.']
]);
notes.getRange('B:B').format.columnWidth = 110;
tab('SLA policy',[['Service','Working days'],...Object.entries(data.services)]);
tab('Stage owners',[['Stage','Office'],...Object.entries(data.owners)]);
function records(name, objects) {
  const keys = Object.keys(objects[0]);
  tab(name,[keys,...objects.map(row=>keys.map(key=>row[key]))]);
}
records('Requests',data.requests);
records('Academic milestones',data.milestones);
records('Admissions',data.admissions);
records('Peer benchmarks',data.peers);
const file = await SpreadsheetFile.exportXlsx(workbook);
await file.save(output);

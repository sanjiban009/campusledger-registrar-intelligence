"use strict";
const data = window.CAMPUS_DATA;
const pages = {
  overview: ['Registrar’s overview', 'Track service delivery and upcoming academic deadlines.', '▦'],
  services: ['Student services', 'Find bottlenecks and investigate individual requests.', '≡'],
  academic: ['Academic readiness', 'Review registrations, exam eligibility, marks and result approvals.', '◷'],
  admissions: ['Admissions & market research', 'Compare programme demand, seat utilisation and peer benchmarks.', '↗'],
  actions: ['Forecast & action centre', 'Review service risks, forecast demand and track follow-up actions.', '◎']
};
const el = id => document.getElementById(id);
const number = new Intl.NumberFormat('en-IN');
const n = value => number.format(value);
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
const fee = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0});
const utc = value => new Date(value + 'T00:00:00Z');
const dateText = value => utc(value).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
function shift(value, days) {
  const date = utc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0,10);
}
function workdays(start, end) {
  let count = 0;
  while (start < end) {
    start = shift(start, 1);
    const weekday = utc(start).getUTCDay();
    if (weekday > 0 && weekday < 6) count++;
  }
  return count;
}
const options = (values, all) => (all ? '<option value="">' + all + '</option>' : '') +
  values.map(value => '<option value="' + value + '">' + value + '</option>').join('');
const sum = (rows, key) => rows.reduce((a,r) => a + r[key], 0);
function groups(rows, key, value = () => 1) {
  const counts = new Map();
  rows.forEach(r => counts.set(r[key], (counts.get(r[key]) || 0) + value(r)));
  return [...counts].sort((a,b) => b[1] - a[1]);
}
const fyLabel = y => y + '–' + String(y+1).slice(-2);
const years = [2026,2025,2024];
el('fy').innerHTML = years.map(y => '<option value="' + y + '">' + fyLabel(y) + '</option>').join('');
el('school').innerHTML = options(Object.keys(data.schools), 'All schools');
el('service').innerHTML = options(Object.keys(data.services), 'All services');
function programmes() {
  const school = el('school').value;
  el('programme').innerHTML = options(school ? data.schools[school] : Object.values(data.schools).flat(), 'All programmes');
}
programmes();
const navigation = el('navigation');
navigation.innerHTML = Object.entries(pages).map(([key, page]) =>
  '<button data-page="' + key + '"><span aria-hidden="true">' + page[2] + '</span>' + page[0] + '</button>').join('');
const getPage = () => Object.hasOwn(pages, location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
navigation.addEventListener('click', e => {
  const button = e.target.closest('button[data-page]');
  if (button) location.hash = button.dataset.page;
});

function scope() {
  const year = Number(el('fy').value);
  const start = year + '-04-01';
  const full = (year+1) + '-03-31';
  const matched = year + data.cutoff.slice(4);
  const end = [data.cutoff, el('period').value === 'ytd' ? matched : full].sort()[0];
  const school = el('school').value;
  const programme = el('programme').value;
  const service = el('service').disabled ? '' : el('service').value;
  const organisation = r => (!school || r.school === school) && (!programme || r.programme === programme);
  const inPeriod = date => date >= start && date <= end;
  const requests = data.requests.filter(r => organisation(r) && (!service || r.service === service) && r.opened <= end);
  const arrivals = requests.filter(r => inPeriod(r.opened));
  const closed = requests.filter(r => inPeriod(r.closed));
  const open = requests.filter(r => r.closed > end).map(r => {
    const stage = r.approval <= end ? 'Approval' : r.verification <= end ? 'Verification' : 'Intake';
    const remaining = r.due < end ? 0 : workdays(end, r.due);
    const breach = r.due <= end;
    const risk = !breach && remaining <= ({Intake:4, Verification:3, Approval:1})[stage];
    return {...r, stage, remaining, breach, risk, owner:data.owners[stage]};
  });
  const milestones = data.milestones.filter(r => organisation(r) && r.due >= start &&
    r.due <= [full, shift(end,14)].sort()[0] && r.baseline <= end).map(r =>
     ({...r, pending:r.completed <= end ? 0 : r.total-r.cleared}));
  return {year,start,end, requests,arrivals,closed,open,milestones,
    admissions:data.admissions.filter(r => organisation(r) && inPeriod(r.date)),
    peers:data.peers.filter(r => organisation(r) && inPeriod(r.date))};
}
const metric = (label, value, detail) => '<article class="card"><div class="metric">' + label +
  '</div><div class="value">' + value + '</div><small>' + detail + '</small></article>';
const kpis = (...items) => '<section class="kpis">' + items.join('') + '</section>';
const insight = (finding, action) => '<section class="insight"><strong>Insight &amp; next action</strong><p>' +
  finding + '</p><p>' + action + '</p></section>';
function bars(title, items, format = n) {
  const max = Math.max(1,...items.map(x => x[1]));
  return '<section class="card"><h2>' + title + '</h2><div class="bars">' + (items.length ? items.map(([name,value]) =>
    '<div class="bar"><span>' + name + '</span><span class="track" aria-hidden="true"><i style="width:' +
    100 * value/max + '%"></i></span><b>' + format(value) + '</b></div>').join('') : '<p>No records in this selection.</p>') + '</div></section>';
}
const grid = (...sections) => '<div class="grid">' + sections.join('') + '</div>';
function table(title, columns, rows, control = '') {
  return '<section class="card panel"><div class="panel-head"><h2>' + title + '</h2>' + control + '</div>' +
    (rows.length ? '<div class="table-wrap" tabindex="0" aria-label="' + title + '"><table><thead><tr>' +
    columns.map(c => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(row => '<tr>' + row.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>' : '<p>No records in this selection.</p>') + '</section>';
}
const upcoming = s => s.milestones.filter(r => r.pending && r.due > s.end);
const overdue = s => s.open.filter(r => r.breach);
const atRisk = s => s.open.filter(r => r.risk);
const onTime = s => s.closed.filter(r => r.closed <= r.due).length;
function milestoneTable(rows, end) {
  return table('Academic milestones', ['Deadline','Milestone','Programme','Pending items','Responsible office','Status'],
    [...rows].sort((a,b) => a.due.localeCompare(b.due)).map(r => [dateText(r.due),r.task,r.programme,
    n(r.pending),r.owner,r.pending ? (r.due <= end ? '<span class="bad">Overdue</span>' : '<span class="warn">Upcoming</span>') :
    '<span class="good">Complete</span>']));
}
function requestTable(rows, downloadable) {
  return table('Open request register', ['Request ID','Programme','Service','SLA deadline','Stage','Responsible office','Status'],
    rows.map(r => [r.id,r.programme,r.service,dateText(r.due),r.stage,r.owner,
      r.breach ? '<span class="bad">Overdue</span>' : r.risk ? '<span class="warn">At risk</span>' : 'On track']),
    downloadable ? '<button class="action" id="export">Export open cases</button>' : '');
}
function monthly(s) {
  const buckets = {};
  for (let m = s.start.slice(0,7); m <= s.end.slice(0,7); ) {
    buckets[m] = 0;
    const next = utc(m + '-01');
    next.setUTCMonth(next.getUTCMonth()+1);
    m = next.toISOString().slice(0,7);
  }
  s.arrivals.forEach(r => buckets[r.opened.slice(0,7)]++);
  return Object.entries(buckets).map(([key,v]) => [utc(key + '-01').toLocaleDateString('en-IN',{month:'short',year:'2-digit',timeZone:'UTC'}),v]);
}
function overview(s) {
  const late = overdue(s);
  const top = groups(late,'stage')[0];
  return kpis(metric('Requests received',n(s.arrivals.length),'Opened in selected period'),
    metric('Open backlog',n(s.open.length),'All open cases at cutoff'),
    metric('Closed within SLA',pct(onTime(s),s.closed.length),n(s.closed.length) + ' closures in period'),
    metric('Academic deadlines ahead',n(upcoming(s).length),'Pending within 14 days and within FY')) +
    insight(top ? n(late.length) + ' open cases are overdue. ' + n(top[1]) + ' are in ' + top[0].toLowerCase() + '.' :
      'No overdue service cases match this snapshot.',
      top ? 'Ask ' + data.owners[top[0]] + ' to review its overdue queue and assign the oldest cases first.' :
      'Review the next academic milestones for pending work.') +
    grid(bars('Monthly requests received',monthly(s)),bars('Open requests by stage',groups(s.open,'stage'))) +
    milestoneTable(upcoming(s),s.end);
}
function services(s) {
  const durations = s.closed.map(r => workdays(r.opened,r.closed)).sort((a,b) => a-b);
  const mid = Math.floor(durations.length/2);
  const median = durations.length ? (durations[mid] + durations[Math.floor((durations.length-1)/2)])/2 : '—';
  const top = groups(overdue(s),'service')[0];
  return kpis(metric('Open cases',n(s.open.length),'Includes carry-in'),
    metric('Overdue cases',n(overdue(s).length),'Open at or past SLA deadline'),
    metric('Median turnaround',median,'Working days for period closures'),
    metric('SLA compliance',pct(onTime(s),s.closed.length),'On-time closures ÷ period closures')) +
    insight(top ? top[0] + ' accounts for ' + n(top[1]) + ' overdue cases.' : 'No open cases have exceeded their deadline.',
      top ? 'Filter to this service and use the case register to identify the responsible office.' :
      'Review cases approaching their SLA deadline in the action centre.') +
    grid(bars('Open cases by service',groups(s.open,'service')),bars('Overdue cases by stage',groups(overdue(s),'stage'))) +
    requestTable([...s.open].sort((a,b) => a.due.localeCompare(b.due)),true);
}
function academic(s) {
  const pending = s.milestones.filter(r => r.pending);
  const late = pending.filter(r => r.due <= s.end);
  const soon = upcoming(s);
  const top = [...pending].sort((a,b) => a.due.localeCompare(b.due))[0];
  return kpis(metric('Milestones in view',n(s.milestones.length),'Includes next 14 days where visible'),
    metric('Overdue milestones',n(late.length),'With pending items'),
    metric('Upcoming milestones',n(soon.length),'Pending within 14 days'),
    metric('Pending items',n(sum(pending,'pending')),'Across visible milestones')) +
    insight(top ? top.programme + ' has ' + top.pending + ' items pending for ' + top.task.toLowerCase() +
      ' with a ' + dateText(top.due) + ' deadline.' : 'No visible academic milestones have pending items.',
      top ? 'Ask the ' + top.owner + ' to confirm an owner and completion date.' : 'Review the next academic reporting cycle.') +
    grid(bars('Pending items by school',groups(pending,'school',r=>r.pending)),
      bars('Pending items by milestone',groups(pending,'task',r=>r.pending))) +
    milestoneTable(s.milestones,s.end);
}
function admissions(s) {
  const a = s.admissions;
  const applications = sum(a,'applications'), enrolled = sum(a,'enrolled'), seats = sum(a,'seats');
  const top = groups(a,'district',r=>r.applications)[0];
  const programmes = [...new Set(a.map(r=>r.programme))].map(p=>{
    const rows=a.filter(r=>r.programme===p);
    return [p,sum(rows,'applications'),sum(rows,'offers'),sum(rows,'enrolled'),sum(rows,'seats')];
  });
  return kpis(metric('Applications',n(applications),'In selected period'),
    metric('Offers',n(sum(a,'offers')),'In selected period'),metric('App-to-enrolment',pct(enrolled,applications),'Enrolled ÷ applications'),
    metric('Seat utilisation',pct(enrolled,seats),n(enrolled) + ' of ' + n(seats) + ' allocated seats')) +
    insight(top ? top[0] + ' leads the selected districts with ' + n(top[1]) + ' applications.' : 'No admissions records match this selection.',
      top ? 'Compare programme conversion with seat utilisation before shifting outreach. Verify peer benchmarks with official brochures for real decisions.' :
      'Select a different school, programme or reporting period.') +
    grid(bars('Applications by district',groups(a,'district',r=>r.applications)),
      bars('Enrolments by programme',groups(a,'programme',r=>r.enrolled))) +
    table('Programme funnel',['Programme','Applications','Offers','Enrolled','Seat allocation','Utilisation'],
      programmes.map(([p,app,offer,enrol,seat])=>[p,n(app),n(offer),n(enrol),n(seat),pct(enrol,seat)])) +
    table('Peer benchmark · simulated research',['Programme','Institution','Annual fee','Eligibility','Specialisation','Apply by','Evidence date','Source'],
      s.peers.map(r=>[r.programme,r.institution,fee.format(r.fee),r.eligibility,r.focus,dateText(r.deadline),dateText(r.date),r.source]));
}
const storageKey = 'campusledger-actions-v1';
let actionStatus = {};
try { actionStatus = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
const statuses = ['To review','In progress','Resolved'];
function forecast(s) {
  const actuals = Array.from({length:4},(_,i)=>{
    const end = shift(s.end,-7*i);
    return s.requests.filter(r=>r.opened >= shift(end,-6) && r.opened <= end).length;
  }).reverse();
  return {actuals, estimate:Math.round(actuals.reduce((a,b)=>a+b,0)/4)};
}
function actions(s) {
  const risk = atRisk(s);
  const late = overdue(s);
  const priority = [...late,...risk].sort((a,b)=>a.due.localeCompare(b.due));
  const key = s.end;
  const f = forecast(s);
  const top = groups(priority,'owner')[0];
  return kpis(metric('Overdue',n(late.length),'Open at or past deadline'),metric('At risk',n(risk.length),'Stage-based working-day rule'),
    metric('Next 7 days',n(f.estimate),'Estimated arrivals'),
    metric('Marked resolved',n(priority.filter(r=>actionStatus[key + r.id] === 'Resolved').length),'Local demo action status')) +
    insight(top ? top[0] + ' owns ' + n(top[1]) + ' overdue or at-risk cases.' : 'No urgent service cases match this selection.',
      top ? 'Review the queue in deadline order. Use the forecast to gauge next-week staffing.' : 'Use the volume forecast to plan coverage.') +
    grid(bars('Weekly arrivals and next-week estimate',[...f.actuals.map((v,i)=>['Week to ' + dateText(shift(s.end,-7*(3-i))),v]),['Next 7 days · estimate',f.estimate]]),
      bars('Priority cases by responsible office',groups(priority,'owner'))) +
    table('Priority action register',['Request ID','Service','Deadline','Risk driver','Responsible office','Follow-up'],
      priority.map(r=>[r.id,r.service,dateText(r.due),r.breach ? 'Overdue · ' + r.stage : r.remaining + ' workday(s) left · ' + r.stage,r.owner,
        '<select class="status-control" aria-label="Action for ' + r.id + '" data-case="' + key + r.id + '">' +
        statuses.map(v=>'<option' + (v === actionStatus[key+r.id] ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>'])) +
    '<section class="card"><h2>Intake classification demo</h2><p>Suggest a service based on keywords. Confirm the category before routing.</p>' +
    '<form class="classifier" id="classify"><input aria-label="Sample request text" required placeholder="Example: I need my official transcript"><button class="action">Suggest category</button></form>' +
    '<p id="prediction" role="status"></p></section>';
}
function download(rows) {
  const fields = ['id','school','programme','service','opened','due','stage','owner','breach','risk'];
  const csv = [fields.join(','),...rows.map(r=>fields.map(field=>'"' + String(r[field]).replaceAll('"','""') + '"').join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href=url; link.download='CampusLedger_Open_Cases.csv'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render() {
  const page = getPage();
  el('service').disabled = ['academic','admissions'].includes(page);
  const s = scope();
  el('page-title').textContent = pages[page][0];
  el('page-description').textContent = pages[page][1];
  el('snapshot').textContent = 'Data through ' + dateText(data.cutoff);
  navigation.querySelectorAll('button').forEach(button=>{
    if (button.dataset.page === page) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  el('scope').textContent = 'FY ' + fyLabel(s.year) + '  ·  ' + dateText(s.start) + ' to ' + dateText(s.end) +
    (el('service').disabled ? '  ·  Service filter applies to service views' : '') +
    (page === 'overview' ? '  ·  Academic KPIs use school and programme' : '');
  el('content').innerHTML = ({overview,services,academic,admissions,actions})[page](s);
  el('export')?.addEventListener('click',()=>download(s.open));
  el('classify')?.addEventListener('submit', e=>{
    e.preventDefault();
    const input=e.currentTarget.querySelector('input').value.toLowerCase();
    const matches = Object.entries({
      Transcript:/\b(transcript|grade sheet|mark sheet)\b/,
      'Migration certificate':/\b(migration|transfer certificate)\b/,
      'Enrolment correction':/\b(correction|enrolment|enrollment|name change)\b/,
      Grievance:/\b(grievance|complaint|appeal)\b/
    }).filter(([,expression])=>expression.test(input)).map(([service])=>service);
    el('prediction').textContent=matches.length===1 ? 'Suggested category · ' + matches[0] :
      matches.length ? 'Manual review · Multiple possible categories: ' + matches.join(', ') :
      'Manual review · No category matched.';
  });
}
el('content').addEventListener('change',e=>{
  if (!e.target.matches('.status-control')) return;
  actionStatus[e.target.dataset.case] = e.target.value;
  let saved = true;
  try { localStorage.setItem(storageKey,JSON.stringify(actionStatus)); } catch { saved = false; }
  render();
  const control = el('content').querySelector('[data-case="' + e.target.dataset.case + '"]');
  control?.focus();
  if (!saved) el('scope').textContent += '  ·  Action saved for this session only';
});
document.querySelector('.filters').addEventListener('change',e=>{
  if(e.target.id==='school') programmes();
  render();
});
el('reset').addEventListener('click',()=>{
  el('fy').selectedIndex=0; el('period').selectedIndex=0;
  el('school').selectedIndex=0; el('service').selectedIndex=0;
  programmes(); render();
});
window.addEventListener('hashchange',render);
render();

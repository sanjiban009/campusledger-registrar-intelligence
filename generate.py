"""Generate reproducible demo data with no student-identifying information."""
from datetime import date, timedelta
from pathlib import Path
import json
import random

root = Path(__file__).resolve().parents[1]
rng = random.Random(72)
schools = {"Engineering": ["B.Tech IT", "B.Tech ECE"], "Management": ["BBA", "MBA"],
           "Sciences": ["B.Sc Data Science", "M.Sc Data Science"], "Humanities": ["BA English", "MA English"]}
services = {"Transcript": 5, "Migration certificate": 7, "Enrolment correction": 4, "Grievance": 10}
owners = {"Intake": "Student Services", "Verification": "Records Office", "Approval": "Registrar Operations"}
start, cutoff = date(2024, 4, 1), date(2026, 11, 20)

def workday_after(day, count):
    while count:
        day += timedelta(days=1)
        count -= day.weekday() < 5
    return day.isoformat()

requests = []
for offset in range((cutoff - start).days + 1):
    opened = start + timedelta(days=offset)
    if opened.weekday() >= 5:
        continue
    for _ in range(rng.randint(2, 8) + (3 if opened.month in (6, 7, 11) else 0)):
        school = rng.choice(list(schools))
        service = rng.choices(list(services), [5, 2, 3, 1])[0]
        slow = service == 'Transcript' and opened.month in (6, 7, 11)
        intake = rng.randint(0, 2)
        verification = intake + rng.randint(1, 8 if slow else 4)
        done = verification + rng.randint(1, 4)
        n = len(requests) + 1
        requests.append(dict(id=f'REQ-{n:05}', school=school, programme=rng.choice(schools[school]),
                             service=service, opened=opened.isoformat(), due=workday_after(opened, services[service]),
                             verification=workday_after(opened, intake), approval=workday_after(opened, verification),
                             closed=workday_after(opened, done)))

milestones, admissions, peers = [], [], []
for year in (2024, 2025, 2026):
    for school, programmes in schools.items():
        for programme in programmes:
            for month, day, task, owner in [(6, 30, 'Semester registration', 'Academic Office'),
                    (11, 24, 'Exam eligibility clearance', 'Examination Cell'),
                    (11, 30, 'Internal marks submission', 'Department Coordinator'),
                    (12, 4, 'Result approval', 'Controller of Examinations')]:
                due = date(year, month, day)
                total = rng.randint(46, 120)
                completed = due + timedelta(days=rng.randint(-13, 9))
                baseline = min(date(year, month, 15), due - timedelta(days=1))
                cleared = total - rng.randint(3, 19)
                milestones.append(dict(school=school, programme=programme, task=task, due=due.isoformat(),
                    owner=owner, total=total, baseline=baseline.isoformat(), cleared=cleared, completed=completed.isoformat()))
            for month in (4, 5, 6, 7, 8, 9):
                for district in ('Kolkata', 'North 24 Parganas', 'Hooghly', 'Howrah'):
                    day = date(year, month, 15)
                    seats = rng.randint(3, 9)
                    applied = rng.randint(10, 43)
                    offers = rng.randint(6, applied)
                    admissions.append(dict(school=school, programme=programme, date=day.isoformat(), district=district,
                                           applications=applied, offers=offers, enrolled=rng.randint(1, min(offers, seats)), seats=seats))
            for institution in ('CampusLedger Demo University', 'Eastfield Institute', 'Harbourbridge University'):
                peers.append(dict(school=school, programme=programme, institution=institution, date=f'{year}-08-15',
                    fee=rng.randrange(55, 151, 5)*1000,
                    eligibility='Relevant degree' if programme.startswith(('M.', 'MBA', 'MA ')) else 'Class XII',
                    focus=rng.choice(['Applied analytics', 'Industry immersion', 'Research project']),
                    deadline=f'{year}-09-{rng.randint(8,25):02}', source='Simulated brochure'))

data = dict(start=start.isoformat(), cutoff=cutoff.isoformat(), schools=schools, services=services,
            owners=owners, requests=requests, milestones=milestones, admissions=admissions, peers=peers)
(root / 'data' / 'dataset.js').write_text('window.CAMPUS_DATA = ' + json.dumps(data, separators=(',', ':')) + ';\n')

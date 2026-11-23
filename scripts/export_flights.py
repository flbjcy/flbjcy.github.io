"""Export only public flight fields. The private workbook must stay outside this repository."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path
from openpyxl import load_workbook

def export(workbook, output, airport_file):
    wb = load_workbook(workbook, read_only=True, data_only=True)
    ws = wb['Flights']
    airports = json.loads(Path(airport_file).read_text())
    flights, seen = [], set()
    for row_number, row in enumerate(ws.iter_rows(min_row=8, max_col=11, values_only=True), 8):
        number, date, origin, destination, airline, aircraft, registration, seat, departure, arrival, publish = row
        if not number or str(publish or '').strip().lower() == 'no':
            continue
        if str(publish or '').strip().lower() not in ('', 'yes'):
            raise ValueError(f'Row {row_number}: Publish must be Yes or No')
        number = str(number).strip().upper().replace(' ', '')
        if not re.fullmatch(r'[A-Z0-9]{2}\d{1,4}', number):
            raise ValueError(f'Row {row_number}: invalid flight number')
        if isinstance(date, (dt.datetime, dt.date)):
            date = date.strftime('%Y-%m-%d')
        else:
            text = str(date or '').strip()
            date = dt.datetime.strptime(text, '%Y%m%d' if re.fullmatch(r'\d{8}', text) else '%Y-%m-%d').strftime('%Y-%m-%d')
        origin, destination = str(origin or '').strip().upper(), str(destination or '').strip().upper()
        if origin not in airports or destination not in airports or not airline:
            raise ValueError(f'Row {row_number}: research airline and airport codes/coordinates before publishing')
        key = (number[:2] + str(int(number[2:])), date)
        if key in seen:
            raise ValueError(f'Row {row_number}: duplicate flight/date')
        seen.add(key)
        clean = lambda value: str(value).strip() if value is not None and str(value).strip() else None
        flights.append(dict(number=number, date=date, **{'from':origin, 'to':destination}, airline=clean(airline), aircraft=clean(aircraft), registration=clean(registration), seat=clean(seat), departure=clean(departure), arrival=clean(arrival)))
    wb.close()
    used = {f[k] for f in flights for k in ('from', 'to')}
    result = {'airports': {k:v for k,v in airports.items() if k in used}, 'flights':flights}
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    output = Path(output)
    if output.exists() and output.read_text() == content:
        print('Unchanged')
        return
    tmp = output.with_suffix('.tmp')
    tmp.write_text(content)
    tmp.replace(output)
    print(f'Exported {len(flights)} flights; private notes and sources excluded')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook')
    parser.add_argument('--output', default='data/flights.json')
    parser.add_argument('--airports', default='data/airports.json')
    args = parser.parse_args()
    export(args.workbook, args.output, args.airports)

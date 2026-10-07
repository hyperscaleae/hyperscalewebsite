"""Create the print-ready reference copies from the editable HTML templates."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'studio-materials' / 'Print Materials'
OUTPUT.mkdir(parents=True, exist_ok=True)
QA = ROOT / 'tmp' / 'studio-pdf-qa'
QA.mkdir(parents=True, exist_ok=True)

class Content(HTMLParser):
    def __init__(self):
        super().__init__(); self.active = False; self.capture = None; self.buffer = []; self.items = []; self.rows = []; self.row = []; self.table = False
    def handle_starttag(self, tag, attrs):
        if tag == 'article': self.active = True
        if not self.active: return
        if tag == 'table': self.table = True; self.rows = []
        if tag == 'tr': self.row = []
        if tag in ('h1', 'h2', 'p', 'small', 'td', 'th'): self.capture = tag; self.buffer = []
        if tag == 'br' and self.capture: self.buffer.append('\n')
    def handle_data(self, text):
        if self.active and self.capture: self.buffer.append(text)
    def handle_endtag(self, tag):
        if tag == 'article': self.active = False
        if tag == self.capture:
            value = ''.join(self.buffer).strip()
            if tag in ('td', 'th'): self.row.append(value)
            else: self.items.append((tag, value))
            self.capture = None
        if tag == 'tr' and self.table: self.rows.append(self.row)
        if tag == 'table' and self.table: self.items.append(('table', self.rows)); self.table = False

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='HS Title', fontName='Helvetica-Bold', fontSize=36, leading=40, spaceAfter=26, textColor=HexColor('#15271d')))
styles.add(ParagraphStyle(name='HS Head', fontName='Helvetica-Bold', fontSize=11, leading=15, spaceBefore=18, spaceAfter=8, textColor=HexColor('#15271d')))
styles.add(ParagraphStyle(name='HS Body', fontName='Helvetica', fontSize=10, leading=15, spaceAfter=10, textColor=HexColor('#273b2e')))
styles.add(ParagraphStyle(name='HS Fine', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=10, textColor=HexColor('#596c50')))

def page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(HexColor('#14281e')); canvas.setFont('Helvetica-Bold', 12)
    canvas.drawString(48, height - 44, 'HYPERSCALE')
    canvas.drawImage(str(ROOT / 'client/public/brand/hyperscale-h.png'), width - 82, height - 57, width=28, height=28, preserveAspectRatio=True, mask='auto')
    canvas.setStrokeColor(HexColor('#cbd4c4')); canvas.line(48, height - 68, width - 48, height - 68)
    canvas.line(48, 47, width - 48, 47)
    canvas.setFont('Helvetica', 8); canvas.setFillColor(HexColor('#596c50'))
    canvas.drawString(48, 31, 'Editable reference copy  |  Complete bracketed fields before use')
    canvas.drawRightString(width - 48, 31, str(doc.page))
    canvas.restoreState()

generated = []
for source in sorted((ROOT / 'studio-materials/Editable Templates').glob('*.html')):
    parser = Content(); parser.feed(source.read_text(encoding='utf-8'))
    story = []
    invoice = 'Invoice' in source.name
    agreement = 'Agreement' in source.name
    styles['HS Title'].spaceAfter = 18 if agreement else 26
    if invoice or agreement:
        styles['HS Body'].leading = 12
        styles['HS Body'].spaceAfter = 7
        styles['HS Head'].spaceBefore = 8 if agreement else 12
    else:
        styles['HS Body'].leading = 15
        styles['HS Body'].spaceAfter = 10
        styles['HS Head'].spaceBefore = 18
    for tag, value in parser.items:
        if tag == 'table':
            rows = [[Paragraph(escape(cell), styles['HS Fine']) for cell in row] for row in value]
            table = Table(rows, colWidths=[225, 45, 110, 119], repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,HexColor('#cbd4c4')),('BACKGROUND',(0,0),(-1,0),HexColor('#e7f0d2')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
            story.extend([Spacer(1,12), table, Spacer(1,15)])
            continue
        value = escape(value).replace('\n','<br/>')
        if not value: continue
        style = styles['HS Title' if tag == 'h1' else 'HS Head' if tag == 'h2' else 'HS Fine' if tag == 'small' or 'draft' in value.lower() or 'not a live' in value.lower() else 'HS Body']
        paragraph = Paragraph(value, style)
        if tag == 'h2': paragraph.keepWithNext = True
        story.append(paragraph)
        if ('Inquiry' in source.name or 'Feedback' in source.name) and tag == 'p' and value.startswith('['):
            story.append(Spacer(1, 26))
    if 'Agreement' in source.name:
        signatures = Table([[Paragraph('For HyperScale<br/><br/>Name ___________________<br/>Signature ________________<br/>Date ____________________', styles['HS Body']), Paragraph('For the client<br/><br/>Name ___________________<br/>Signature ________________<br/>Date ____________________', styles['HS Body'])]], colWidths=[249,250])
        signatures.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP')]))
        story.extend([Spacer(1,15),signatures])
    if 'Client-portal' in source.name:
        story.append(Paragraph('Digital version: export a client snapshot from the dashboard. A secure shared online portal requires hosting and sign-in.', styles['HS Fine']))
    filename = OUTPUT / (source.stem + '.pdf')
    SimpleDocTemplate(str(filename), pagesize=A4, leftMargin=48, rightMargin=48, topMargin=95, bottomMargin=68, title=source.stem.replace('-', ' '), author='HyperScale').build(story, onFirstPage=page, onLaterPages=page)
    generated.append(filename)
    pdf = pdfium.PdfDocument(str(filename))
    for index in range(len(pdf)):
        pdf[index].render(scale=1.25).to_pil().save(QA / f'{source.stem}-{index+1}.png')
    print(filename.name, 'pages:', len(pdf))
pack = PdfWriter()
for filename in generated: pack.append(str(filename))
pack.write(str(OUTPUT / 'HyperScale-Client-Workflow-Pack.pdf'))
print('Combined print pack pages:', len(pack.pages))

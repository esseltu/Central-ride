
with open('src/views/student/StudentHome.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('<div style={{ position: \'relative\', width: \'100%\', height: \'100dvh\', overflow: \'hidden\' }}>', '<div className=\'student-home-wrapper\' style={{ position: \'relative\', width: \'100%\', height: \'100dvh\', overflow: \'hidden\' }}>')

c = c.replace('<div style={{ position: \'absolute\', top: 0, left: 0, right: 0, bottom: ${sheetHeight}px, zIndex: 0 }}>', '<div className=\'map-container\' style={{ position: \'absolute\', top: 0, left: 0, right: 0, bottom: ${sheetHeight}px, zIndex: 0 }}>')

with open('src/views/student/StudentHome.jsx', 'w', encoding='utf-8') as f:
    f.write(c)


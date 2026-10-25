const { spawn } = require('child_process');

async function inspectTab() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-test-pg-3'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const tab = await fetch('http://127.0.0.1:9224/json/new?http://localhost:5000', { method: 'PUT' }).then(r => r.json());
  console.log('Tab debugger URL:', tab.webSocketDebuggerUrl);

  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description));
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', JSON.stringify(data.params.exceptionDetails, null, 2));
    } else if (data.id === 10) {
      console.log('[APP-ROOT INNERHTML]:\n', data.result?.result?.value);
    } else if (data.id === 11) {
      console.log('[READY STATE]:', data.result?.result?.value);
    }
  };

  await new Promise(r => setTimeout(r, 3000));

  ws.send(JSON.stringify({
    id: 11,
    method: 'Runtime.evaluate',
    params: { expression: 'document.readyState' }
  }));

  ws.send(JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: { expression: 'document.getElementById("app-root").innerHTML' }
  }));

  await new Promise(r => setTimeout(r, 2000));
  chrome.kill();
}

inspectTab().catch(console.error);

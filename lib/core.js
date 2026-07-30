export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Colombo' }).format(new Date());
}

export function seedState() {
  const cartridge337 = 'Admin — Canon imageCLASS MF249dw | Finance — Canon imageCLASS MF244dw | HO — Canon imageCLASS MF244dw';
  const cartridge054 = 'CEO — Canon imageCLASS MF645Cx';
  const epson008 = 'HR — Epson EcoTank L6490 | Advisory — Epson EcoTank L6490';
  return {
    assetDataVersion: 3,
    printers: [
      { id:1, name:'Admin — Canon imageCLASS MF249dw', location:'Admin', month:0, total:0, toner:'Canon Cartridge 337' },
      { id:2, name:'CMB — Canon imageRUNNER 2725i', location:'CMB', month:0, total:0, toner:'Canon NPG-87 Black' },
      { id:3, name:'CEO — Canon imageCLASS MF645Cx', location:'CEO', month:0, total:0, toner:'Canon Cartridge 054 BK/C/M/Y' },
      { id:4, name:'Finance — Canon imageCLASS MF244dw', location:'Finance', month:0, total:0, toner:'Canon Cartridge 337' },
      { id:5, name:'HO — Canon imageCLASS MF244dw', location:'HO', month:0, total:0, toner:'Canon Cartridge 337' },
      { id:6, name:'HR — Epson EcoTank L6490', location:'HR', month:0, total:0, toner:'Epson 008 BK/C/M/Y' },
      { id:7, name:'Advisory — Epson EcoTank L6490', location:'Advisory', month:0, total:0, toner:'Epson 008 BK/C/M/Y' }
    ],
    toners: [
      { id:1, tonerNo:'TNR-0001', name:'Black', brand:'Canon', model:'Cartridge 337', compatible:cartridge337, qty:0, minQty:2, color:'#444441' },
      { id:2, tonerNo:'TNR-0002', name:'Black', brand:'Canon', model:'NPG-87', compatible:'CMB — Canon imageRUNNER 2725i', qty:0, minQty:1, color:'#444441' },
      { id:3, tonerNo:'TNR-0003', name:'Black', brand:'Canon', model:'Cartridge 054 BK', compatible:cartridge054, qty:0, minQty:1, color:'#444441' },
      { id:4, tonerNo:'TNR-0004', name:'Cyan', brand:'Canon', model:'Cartridge 054 C', compatible:cartridge054, qty:0, minQty:1, color:'#185FA5' },
      { id:5, tonerNo:'TNR-0005', name:'Magenta', brand:'Canon', model:'Cartridge 054 M', compatible:cartridge054, qty:0, minQty:1, color:'#993556' },
      { id:6, tonerNo:'TNR-0006', name:'Yellow', brand:'Canon', model:'Cartridge 054 Y', compatible:cartridge054, qty:0, minQty:1, color:'#BA7517' },
      { id:7, tonerNo:'TNR-0007', name:'Black', brand:'Epson', model:'008 / C13T06G100', compatible:epson008, qty:0, minQty:1, color:'#444441' },
      { id:8, tonerNo:'TNR-0008', name:'Cyan', brand:'Epson', model:'008 / C13T06G200', compatible:epson008, qty:0, minQty:1, color:'#185FA5' },
      { id:9, tonerNo:'TNR-0009', name:'Magenta', brand:'Epson', model:'008 / C13T06G300', compatible:epson008, qty:0, minQty:1, color:'#993556' },
      { id:10, tonerNo:'TNR-0010', name:'Yellow', brand:'Epson', model:'008 / C13T06G400', compatible:epson008, qty:0, minQty:1, color:'#BA7517' }
    ],
    requests: [],
    stockHistory: [],
    users: [
      { id:1, name:'Admin User', email:'admin@office.lk', role:'admin', dept:'IT', avatar:'AD' },
      { id:2, name:'Amal Silva', email:'amal@office.lk', role:'staff', dept:'Finance', avatar:'AS' },
      { id:3, name:'Priya Jayawardena', email:'priya@office.lk', role:'staff', dept:'HR', avatar:'PJ' },
      { id:4, name:'Roshan Fernando', email:'roshan@office.lk', role:'staff', dept:'Marketing', avatar:'RF' }
    ],
    emailConfig: { supportEmail:'', enabled:false }
  };
}

export function nextId(list) {
  return list.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

function cleanText(value, label, max = 200, required = true) {
  const text = String(value ?? '').trim();
  if (required && !text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} is too long.`);
  if (/[<>&"']/.test(text)) throw new Error(`${label} contains unsupported characters.`);
  return text;
}

function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new Error('Enter a valid email address.');
  return email;
}

function wholeNumber(value, label, min = 0, max = 100000000) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return number;
}

function findOrThrow(list, id, label) {
  const row = list.find(item => item.id === Number(id));
  if (!row) throw new Error(`${label} was not found.`);
  return row;
}

export function tonerMatchesPrinter(toner, printerName) {
  return String(toner.compatible || '').split('|').map(value => value.trim()).includes(printerName);
}

export function publicView(state, user) {
  if (user.role === 'admin') return state;
  return {
    printers: state.printers,
    toners: [],
    requests: state.requests.filter(request => request.uid === user.id),
    stockHistory: [],
    users: [user],
    emailConfig: { supportEmail:'', enabled:false }
  };
}

export function performAction(state, user, action, payload = {}) {
  if (action === 'request:create') {
    if (user.role !== 'staff') throw new Error('Use a staff account to submit a request.');
    const printer = findOrThrow(state.printers, payload.printerId, 'Printer');
    const printCount = wholeNumber(payload.printCount, 'Print count');
    const note = cleanText(payload.note, 'Note', 300, false);
    if (state.requests.some(row => row.uid === user.id && row.printer === printer.name && row.status === 'pending')) {
      throw new Error('You already have a pending request for this printer.');
    }
    if (printCount > 0) printer.month = printCount;
    state.requests.push({
      id:nextId(state.requests), tonerNo:'', tonerName:'(pending admin)',
      printer:printer.name, user:user.name, uid:user.id, date:today(),
      status:'pending', note, printCount
    });
    return state;
  }

  if (user.role !== 'admin') throw new Error('Administrator permission is required.');

  if (action === 'toner:add') {
    const tonerNo = String(payload.tonerNo || '').trim().toUpperCase();
    if (!/^[A-Z0-9._/-]{2,30}$/.test(tonerNo)) throw new Error('Enter a valid toner number.');
    if (state.toners.some(row => row.tonerNo.toLowerCase() === tonerNo.toLowerCase())) throw new Error('Toner number already exists.');
    const toner = {
      id:nextId(state.toners), tonerNo,
      name:cleanText(payload.name,'Color',50),
      brand:cleanText(payload.brand,'Brand',60,false),
      model:cleanText(payload.model,'Model',60),
      compatible:cleanText(payload.compatible,'Compatible printer',500),
      qty:wholeNumber(payload.qty,'Quantity'),
      minQty:wholeNumber(payload.minQty,'Minimum quantity',1,100000),
      color:'#888780'
    };
    state.toners.push(toner);
    if (toner.qty > 0) state.stockHistory.push({
      date:today(), type:'new', tonerNo, desc:`${toner.name} ${toner.model}`,
      qty:toner.qty, note:`Opening stock — ${toner.qty} units`, by:user.name
    });
  } else if (action === 'toner:edit') {
    const toner = findOrThrow(state.toners, payload.id, 'Toner');
    const oldQty = toner.qty;
    Object.assign(toner, {
      name:cleanText(payload.name,'Color',50),
      brand:cleanText(payload.brand,'Brand',60,false),
      model:cleanText(payload.model,'Model',60),
      compatible:cleanText(payload.compatible,'Compatible printer',500),
      qty:wholeNumber(payload.qty,'Quantity'),
      minQty:wholeNumber(payload.minQty,'Minimum quantity',1,100000)
    });
    if (toner.qty !== oldQty) state.stockHistory.push({
      date:today(), type:'adjust', tonerNo:toner.tonerNo,
      desc:`${toner.name} ${toner.model}`, qty:Math.abs(toner.qty-oldQty),
      note:`Manual adjustment ${oldQty} → ${toner.qty}`, by:user.name
    });
  } else if (action === 'toner:delete') {
    const toner = findOrThrow(state.toners, payload.id, 'Toner');
    state.toners = state.toners.filter(row => row.id !== toner.id);
    state.stockHistory.push({
      date:today(), type:'delete', tonerNo:toner.tonerNo,
      desc:`${toner.name} ${toner.model}`, qty:toner.qty,
      note:'Toner record deleted', by:user.name
    });
  } else if (action === 'stock:receive' || action === 'stock:issue') {
    const toner = findOrThrow(state.toners, payload.id, 'Toner');
    const qty = wholeNumber(payload.qty,'Quantity',1,100000);
    const note = cleanText(payload.note,'Note',200,false) || (action === 'stock:receive' ? 'Stock received' : 'Issued');
    const printer = action === 'stock:issue' ? findOrThrow(state.printers, payload.printerId, 'Printer') : null;
    if (printer && !tonerMatchesPrinter(toner, printer.name)) throw new Error('This toner is not registered for the selected printer.');
    if (action === 'stock:issue' && qty > toner.qty) throw new Error(`Not enough stock. Available: ${toner.qty}.`);
    toner.qty += action === 'stock:receive' ? qty : -qty;
    state.stockHistory.push({
      date:today(), type:action === 'stock:receive' ? 'in' : 'out',
      tonerNo:toner.tonerNo, desc:`${toner.name} ${toner.model}`, qty, note,
      by:user.name, printerId:printer ? printer.id : null, printer:printer ? printer.name : ''
    });
  } else if (action === 'printer:add') {
    const name = cleanText(payload.name,'Printer name',100);
    if (state.printers.some(row => row.name.toLowerCase() === name.toLowerCase())) throw new Error('Printer already exists.');
    state.printers.push({
      id:nextId(state.printers), name,
      location:cleanText(payload.location,'Location',100),
      month:0, total:0,
      toner:cleanText(payload.toner,'Toner model',80,false) || '—'
    });
  } else if (action === 'printer:edit') {
    const printer = findOrThrow(state.printers,payload.id,'Printer');
    Object.assign(printer,{
      name:cleanText(payload.name,'Printer name',100),
      location:cleanText(payload.location,'Location',100),
      toner:cleanText(payload.toner,'Toner model',80,false) || '—',
      month:wholeNumber(payload.month,'Monthly count'),
      total:wholeNumber(payload.total,'Total count')
    });
  } else if (action === 'printer:delete') {
    const printer = findOrThrow(state.printers,payload.id,'Printer');
    if (state.requests.some(row => row.printer === printer.name && row.status === 'pending')) {
      throw new Error('Resolve pending requests for this printer before deleting it.');
    }
    state.printers = state.printers.filter(row => row.id !== printer.id);
  } else if (action === 'printer:log') {
    const printer = findOrThrow(state.printers,payload.id,'Printer');
    const count = wholeNumber(payload.count,'Print count',1);
    printer.month += count;
    printer.total += count;
  } else if (action === 'request:approve') {
    const request = findOrThrow(state.requests,payload.id,'Request');
    if (request.status !== 'pending') throw new Error('Only pending requests can be approved.');
    const toner = state.toners.find(row => row.tonerNo === payload.tonerNo);
    if (!toner) throw new Error('Select a toner cartridge.');
    if (!tonerMatchesPrinter(toner, request.printer)) throw new Error('This toner is not registered for the selected printer.');
    if (toner.qty < 1) throw new Error('The selected toner is out of stock.');
    toner.qty -= 1;
    request.status='approved';
    request.tonerNo=toner.tonerNo;
    request.tonerName=`${toner.name} ${toner.model}`;
    const requestPrinter = state.printers.find(row => row.name === request.printer);
    state.stockHistory.push({
      date:today(), type:'out', tonerNo:toner.tonerNo, desc:request.tonerName,
      qty:1, note:`Request #REQ-${String(request.id).padStart(3,'0')} · requested by ${request.user}`,
      by:user.name, printerId:requestPrinter ? requestPrinter.id : null, printer:request.printer
    });
  } else if (action === 'request:reject') {
    const request = findOrThrow(state.requests,payload.id,'Request');
    if (request.status !== 'pending') throw new Error('Only pending requests can be rejected.');
    request.status='rejected';
  } else if (action === 'user:add') {
    const email = cleanEmail(payload.email);
    if (state.users.some(row => row.email.toLowerCase() === email)) throw new Error('Email account already exists.');
    const name = cleanText(payload.name,'Name',100);
    state.users.push({
      id:nextId(state.users), name, email, role:'staff',
      dept:cleanText(payload.dept,'Department',80,false) || '—',
      avatar:name.split(/\s+/).map(part => part[0]).join('').toUpperCase().slice(0,2)
    });
  } else if (action === 'user:delete') {
    const target = findOrThrow(state.users,payload.id,'User');
    if (target.id === 1 || target.id === user.id) throw new Error('This administrator account cannot be deleted.');
    state.users = state.users.filter(row => row.id !== target.id);
  } else if (action === 'email:save') {
    state.emailConfig = { supportEmail:cleanEmail(payload.supportEmail), enabled:true };
  } else if (action === 'email:disable') {
    state.emailConfig.enabled = false;
  } else {
    throw new Error('Unknown action.');
  }
  return state;
}

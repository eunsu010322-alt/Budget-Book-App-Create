const fs=require('fs');const html=fs.readFileSync(require('path').join(__dirname,process.env.TARGET||'index.html'),'utf8');
const code=html.split('/*LOGIC-START*/')[1].split('/*LOGIC-END*/')[0];
const L=new Function(code+';return {cycleOf,prevCycle,homeStats,keypadInput,changeRate,median,roundTo,formatMan,classifyAuto,resolveKind,recomputeKind,reassignCategory,halfOf,cumulativeSeries,suggestBudget,minus5,paceOf,fixedDateInCycle,nextFixedDate,payDayLabel,fixedCycleView,upcomingFixed,dueFixed,fixedKey,makeFixedTx,passedThisCycle,recordFromOnCreate,recordFromOnEdit,reassignFixed,earliestCycle,shiftCycleRef,cycleDays,lastImportYMD,importDue,bulkSetCategory,bulkSetKind,cyclesInData,excelDate,excelTime,cellDate,cellTime,cellSec,cellNum,parseSharedStrings,parseSheet,parseBanksaladRows,rowKey,rowId,hashStr,normalizeName,ruleKey,classifyRow,planImport,makeImportTx,catIdByName,lastImported,reassignRules,importSummary,BS_DEFAULT_CHARGE,BS_DEFAULT_RULES};')();
let pass=0,fail=0;const eq=(n,a,b)=>{const ok=JSON.stringify(a)===JSON.stringify(b);ok?pass++:fail++;console.log(ok?'✓':'✗',n,ok?'':`→ ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`)};
console.log('[주기]');
eq('24일은 전 주기',L.cycleOf('2026-09-24').id,'2026-08');
eq('25일은 새 주기',L.cycleOf('2026-09-25').id,'2026-09');
eq('12월25일→1월24일',L.cycleOf('2026-12-31').end,'2027-01-24');
eq('1월10일은 전년 12월 주기',L.cycleOf('2027-01-10').id,'2026-12');
eq('윤년 2/29 주기',L.cycleOf('2028-02-29').end,'2028-03-24');
console.log('[키패드]');
eq('앞 0 제거',L.keypadInput('','00'),'');
eq('00',L.keypadInput('5','00'),'500');
eq('10자리 제한',L.keypadInput('1234567890','1'),'1234567890');
console.log('[분류]');
const cm={a:{id:'a'},g:{id:'g',isSpecial:true},z:{id:'z',isFallback:true}};
const T=300000;
eq('일반 → 생활비',L.resolveKind({amount:10000,categoryId:'a'},cm,T),{kind:'living',kindSource:'auto',ask:false});
eq('이벤트 → 특별',L.resolveKind({amount:10000,categoryId:'a',eventId:'e1'},cm,T),{kind:'special',kindSource:'auto',ask:false});
eq('특별 카테고리 → 특별(질문 없음)',L.resolveKind({amount:500000,categoryId:'g'},cm,T),{kind:'special',kindSource:'auto',ask:false});
eq('30만원 정확히 → 질문',L.resolveKind({amount:300000,categoryId:'a'},cm,T).ask,true);
eq('299,999 → 질문 안 함',L.resolveKind({amount:299999,categoryId:'a'},cm,T).ask,false);
eq('답한 건은 금액 바뀌어도 유지',L.resolveKind({amount:400000,categoryId:'a',kind:'special',kindSource:'asked'},cm,T),{kind:'special',kindSource:'asked',ask:false});
eq('답한 건이 기준 아래로 → 자동 생활비',L.resolveKind({amount:200000,categoryId:'a',kind:'special',kindSource:'asked'},cm,T),{kind:'living',kindSource:'auto',ask:false});
eq('수동 변경은 항상 유지',L.resolveKind({amount:5000,categoryId:'g',kind:'living',kindSource:'manual'},cm,T),{kind:'living',kindSource:'manual',ask:false});
eq('수동 변경은 30만원 이상이어도 질문 안 함',L.resolveKind({amount:900000,categoryId:'a',kind:'special',kindSource:'manual'},cm,T).ask,false);
eq('재계산은 질문 필드 없음',Object.keys(L.recomputeKind({amount:1,categoryId:'g'},cm,T)).includes('ask'),false);
console.log('[카테고리 삭제]');
const txs0=[{id:1,categoryId:'g',amount:50000,kind:'special',kindSource:'auto'},{id:2,categoryId:'g',amount:500000,kind:'special',kindSource:'auto'},{id:3,categoryId:'a',amount:1}];
const mv=L.reassignCategory([...txs0,{id:4,categoryId:'g',amount:1,kind:'special',kindSource:'manual'}],'g','z',cm,T);
eq('옮겨진 건수',mv.length,3);
eq('삭제 시 수동 변경 건은 유지',[mv[2].kind,mv[2].kindSource],['special','manual']);
eq('모두 기타로',mv.every(t=>t.categoryId==='z'),true);
eq('자동 판정 건은 재계산(생활비)',mv[0].kind,'living');
eq('기준 이상 건은 질문 없이 생활비(재계산)',[mv[1].kind,mv[1].kindSource],['living','auto']);
eq('원본 배열은 그대로',txs0[0].categoryId,'g');
console.log('[예산 제안]');
eq('중앙값 홀수',L.median([142,168,151]),151);
eq('중앙값 짝수',L.median([100,200]),150);
eq('151만→150만',L.roundTo(1510000,100000),1500000);
eq('155만→160만',L.roundTo(1550000,100000),1600000);
eq('−5%: 150만→142.5만→143만',L.minus5(1500000),1430000);
eq('−5% 두 번',L.minus5(L.minus5(1500000)),1360000);
eq('만 단위 표기',L.formatMan(1510000),'151만');
eq('만 단위 소수',L.formatMan(445000),'44.5만');
const tx=(date,amount,extra={})=>({date,amount,categoryId:'a',status:'active',kind:'living',time:'12:00',...extra});
const hist=[tx('2026-06-30',1420000),tx('2026-07-30',1680000),tx('2026-08-30',1510000),
  tx('2026-08-30',900000,{kind:'special'}),tx('2026-08-30',100000,{status:'canceled'}),tx('2026-05-30',5000000)];
const sg=L.suggestBudget(hist,'2026-10-05','2026-06-01');
eq('최근 3개 주기 중앙값 → 150만',sg,{amount:1500000,median:1510000,count:3});
eq('설치한 주기 제외(6/26 설치 → 7·8월 주기만)',L.suggestBudget(hist,'2026-10-05','2026-06-26'),{amount:1600000,median:1595000,count:2});
eq('설치 직후엔 제안 없음',L.suggestBudget(hist,'2026-10-05','2026-09-26'),null);
eq('끝난 주기 생활비 0이면 제안 없음',L.suggestBudget([],'2026-10-05','2026-01-01'),null);
console.log('[페이스]');
const c=L.cycleOf('2026-10-05');
const p=L.paceOf(620000,1500000,'2026-10-05',c);
eq('검증 예시: 지출 41%',p.spendPct,41);
eq('검증 예시: 기준선 37%',p.dayPct,37);
eq('검증 예시: 약간 빠름',p.status,'약간 빠름');
eq('검증 예시: 남은 20일',p.daysLeft,20);
eq('검증 예시: 하루 44,000원',p.daily,44000);
eq('여유',L.paceOf(300000,1500000,'2026-10-05',c).status,'여유');
eq('계획대로',L.paceOf(560000,1500000,'2026-10-05',c).status,'계획대로');
eq('빠름',L.paceOf(900000,1500000,'2026-10-05',c).status,'빠름');
eq('초과',L.paceOf(1500000,1500000,'2026-10-05',c).status,'초과');
eq('초과 시 하루 0원',L.paceOf(1600000,1500000,'2026-10-05',c).daily,0);
eq('주기 마지막 날 남은 1일',L.paceOf(0,100,'2026-10-24',c).daysLeft,1);
eq('검증 예시: 적정 55만',p.ideal,550000);
eq('검증 예시: 적정보다 7만 더',p.gap,70000);
console.log('[반기]');
eq('9/17 → 26년 하반기',L.halfOf('2026-09-17').label,'26년 하반기');
eq('하반기 범위',[L.halfOf('2026-09-17').start,L.halfOf('2026-09-17').end],['2026-07-25','2027-01-24']);
eq('27년 1/10 → 아직 26년 하반기',L.halfOf('2027-01-10').id,'2026-H2');
eq('27년 1/25 → 27년 상반기',L.halfOf('2027-01-25').label,'27년 상반기');
eq('7/24 → 상반기 마지막 날',L.halfOf('2026-07-24').id,'2026-H1');
eq('7/25 → 하반기 첫날',L.halfOf('2026-07-25').id,'2026-H2');
console.log('[누적 그래프]');
const cc=L.cycleOf('2026-09-27');
eq('날짜별 누적(취소·특별 제외)',L.cumulativeSeries([tx('2026-09-25',1000),tx('2026-09-27',500),tx('2026-09-27',700,{status:'canceled'}),tx('2026-09-26',9,{kind:'special'}),tx('2026-09-28',5)],cc,'2026-09-27'),[1000,1000,1500]);
eq('주기 첫날',L.cumulativeSeries([],L.cycleOf('2026-09-25'),'2026-09-25'),[0]);
console.log('[홈 집계]');
const cats=[{id:'a',name:'식비',order:0},{id:'b',name:'경조사',order:1,isSpecial:true}];
const txs=[tx('2026-09-25',10000),tx('2026-09-26',5000),tx('2026-09-26',7000,{status:'canceled'}),
 tx('2026-09-26',450000,{categoryId:'b',kind:'special'}),tx('2026-08-25',4000),tx('2026-08-27',100000)];
const s=L.homeStats(txs,cats,'2026-09-26',1500000);
eq('생활비(취소·특별 제외)',s.living,15000);
eq('특별지출(반기 합계)',s.special,450000);
eq('반기 특별지출은 지난 주기도 포함',L.homeStats([...txs,tx('2026-08-01',200000,{kind:'special'}),tx('2026-07-01',99,{kind:'special'})],cats,'2026-09-26',null).special,650000);
eq('오늘 쓴 돈(전체)',s.today,455000);
eq('지난 주기 같은 기간 생활비',s.prevSame,4000);
eq('도넛은 생활비만',s.catRows.map(r=>r.cat.id),['a']);
eq('예산 없으면 페이스 없음',L.homeStats(txs,cats,'2026-09-26',null).pace,null);
console.log('[고정지출: 출금일]');
const C=d=>L.cycleOf(d);
eq('10일 → 주기 다음 달 10일',L.fixedDateInCycle(10,C('2026-09-17')),'2026-09-10');
eq('25일 → 주기 첫날',L.fixedDateInCycle(25,C('2026-09-17')),'2026-08-25');
eq('24일 → 주기 마지막 날',L.fixedDateInCycle(24,C('2026-09-17')),'2026-09-24');
eq('31일 → 8월 31일',L.fixedDateInCycle(31,C('2026-09-17')),'2026-08-31');
eq('31일, 9월 주기 → 9/30 (말일)',L.fixedDateInCycle(31,C('2026-10-01')),'2026-09-30');
eq('30일, 2월 주기(평년) → 2/28',L.fixedDateInCycle(30,C('2027-03-01')),'2027-02-28');
eq('29일, 2월 주기(윤년) → 2/29',L.fixedDateInCycle(29,C('2028-03-01')),'2028-02-29');
eq('연말: 12월 주기 5일 → 다음 해 1/5',L.fixedDateInCycle(5,C('2026-12-30')),'2027-01-05');
eq('연말: 12월 주기 28일 → 12/28',L.fixedDateInCycle(28,C('2027-01-03')),'2026-12-28');
eq('말일 표기',[L.payDayLabel(31),L.payDayLabel(5)],['말일','5일']);
eq('다음 출금: 오늘이 출금일이면 다음 주기',L.nextFixedDate(17,'2026-09-17'),'2026-10-17');
eq('다음 출금: 주기 안에 남아 있음',L.nextFixedDate(20,'2026-09-17'),'2026-09-20');
eq('다음 출금: 주기 경계 넘어감',L.nextFixedDate(26,'2026-09-17'),'2026-09-26');
eq('다음 출금: 연말 넘어감',L.nextFixedDate(10,'2026-12-20'),'2027-01-10');
console.log('[고정지출: 남은 합계]');
const F=(id,payDay,amount,method='account',extra={})=>({id,name:id,payDay,amount,method,categoryId:'a',active:true,recordFrom:'2026-01-01',...extra});
const fx=[F('통신',10,55000),F('보험',20,120000),F('구독',30,9900,'card'),F('월세',17,1,'account',{active:false})];
const v=L.fixedCycleView(fx,'2026-09-17');
eq('출금일 순(8/30 → 9/10 → 9/20)',v.items.map(x=>x.f.id),['구독','통신','보험']);
eq('지난 건은 완료',v.items.map(x=>x.done),[true,true,false]);
eq('남은 합계(카드 포함, 중지 제외)',[v.remaining,v.remainingCount,v.total],[120000,1,184900]);
eq('출금일 당일은 완료',L.fixedCycleView([F('x',17,1)],'2026-09-17').items[0].done,true);
eq('D-day',v.items[2].dday,3);
eq('다가오는 출금 3개(다음 주기 포함)',L.upcomingFixed([...fx,F('관리',25,1)],'2026-09-17').map(x=>[x.f.id,x.date]),[['보험','2026-09-20'],['관리','2026-09-25'],['구독','2026-09-30']]);
console.log('[고정지출: 자동 기록 (v2 호환)]');
const due=L.dueFixed(fx,new Set(),'2026-09-17');
eq('카드·중지 항목은 기록 안 함',due.every(d=>d.f.method==='account'&&d.f.id!=='월세'),true);
eq('기록 시작일부터 밀린 출금 전부',L.dueFixed([F('통신',10,1,'account',{recordFrom:'2026-07-01'})],new Set(),'2026-09-17').map(d=>d.date),['2026-07-10','2026-08-10','2026-09-10']);
eq('이미 기록한 건은 건너뜀',L.dueFixed([F('통신',10,1,'account',{recordFrom:'2026-07-01'})],new Set([L.fixedKey('통신','2026-08-10')]),'2026-09-17').map(d=>d.date),['2026-07-10','2026-09-10']);
eq('출금일 당일 기록',L.dueFixed([F('x',17,1,'account',{recordFrom:'2026-09-01'})],new Set(),'2026-09-17').length,1);
eq('기록 시작일 이전 출금은 안 함',L.dueFixed([F('x',10,1,'account',{recordFrom:'2026-09-18'})],new Set(),'2026-10-10').map(d=>d.date),['2026-10-10']);
eq('기록 시작일이 미래면 없음',L.dueFixed([F('x',10,1,'account',{recordFrom:'2026-09-18'})],new Set(),'2026-09-17'),[]);
eq('말일 항목 연말 경계',L.dueFixed([F('x',31,1,'account',{recordFrom:'2026-11-01'})],new Set(),'2027-03-01').map(d=>d.date),['2026-11-30','2026-12-31','2027-01-31','2027-02-28']);
const cm2={a:{id:'a'},g:{id:'g',isSpecial:true},z:{id:'z',isFallback:true}};
const ft=L.makeFixedTx(F('보험',20,500000),'2026-09-20',cm2,T,'z','t1',1);
eq('30만원 이상이어도 질문 없이 생활비',[ft.kind,ft.kindSource,ft.method,ft.fixedId,ft.merchant],['living','auto','fixed-auto','보험','보험']);
eq('특별지출 카테고리면 특별',L.makeFixedTx(F('회비',5,10000,'account',{categoryId:'g'}),'2026-09-05',cm2,T,'z','t2',1).kind,'special');
eq('카테고리가 없으면 기타로',L.makeFixedTx(F('x',5,1,'account',{categoryId:'gone'}),'2026-09-05',cm2,T,'z','t3',1).categoryId,'z');
eq('자동 기록 건을 수정해도 질문 안 함',L.resolveKind({amount:500000,categoryId:'a',method:'fixed-auto',kind:'living',kindSource:'auto'},cm2,T).ask,false);
console.log('[고정지출: 등록·수정]');
eq('이번 주기 출금일 지남',L.passedThisCycle(10,'2026-09-17'),'2026-09-10');
eq('등록 당일이 출금일이면 지난 것으로',L.passedThisCycle(17,'2026-09-17'),'2026-09-17');
eq('아직 안 지남',L.passedThisCycle(20,'2026-09-17'),null);
eq('기록하기 → 지난 출금일부터',L.recordFromOnCreate(10,'2026-09-17',true),'2026-09-10');
eq('기록 안 함 → 내일부터',L.recordFromOnCreate(10,'2026-09-17',false),'2026-09-18');
const old=F('x',10,1,'account',{recordFrom:'2026-07-01'});
eq('금액만 바꾸면 시작일 유지',L.recordFromOnEdit(old,{...old,amount:2},'2026-09-17'),'2026-07-01');
eq('출금일 바꾸면 내일부터',L.recordFromOnEdit(old,{...old,payDay:5},'2026-09-17'),'2026-09-18');
eq('카드→계좌 바꾸면 내일부터',L.recordFromOnEdit({...old,method:'card'},old,'2026-09-17'),'2026-09-18');
eq('시작일이 더 늦으면 유지',L.recordFromOnEdit({...old,recordFrom:'2026-10-01'},{...old,payDay:5},'2026-09-17'),'2026-10-01');
eq('카테고리 삭제 시 고정지출도 기타로',L.reassignFixed(fx,'a','z').map(f=>f.categoryId),['z','z','z','z']);
console.log('[엑셀 날짜·시각]');
eq('serial 46282 → 2026-09-17', L.excelDate(46282), '2026-09-17');
eq('serial 1 → 1899-12-31', L.excelDate(1), '1899-12-31');
eq('윤년 2028-02-29', L.excelDate(46812), '2028-02-29');
eq('0.5 → 12:00', L.excelTime(0.5), '12:00');
eq('17:16:49 소수', L.excelTime((17 * 3600 + 16 * 60 + 49) / 86400), '17:16');
eq('초까지', L.cellSec((17 * 3600 + 16 * 60 + 49) / 86400), '17:16:49');
eq('자정', L.excelTime(0), '00:00');
eq('문자열 날짜도 받음', L.cellDate('2026-09-17 00:00:00'), '2026-09-17');
eq('문자열 시각도 받음', [L.cellTime('17:16:49'), L.cellSec('17:16:49')], ['17:16', '17:16:49']);
eq('빈 시각', [L.cellTime(null), L.cellSec(null)], ['00:00', '00:00:00']);
eq('금액: 쉼표·원 제거', [L.cellNum('-4,900원'), L.cellNum(-4900), L.cellNum(null), L.cellNum('')], [-4900, -4900, 0, 0]);

console.log('[중복 방지 키]');
const IR = (o = {}) => ({ date: '2026-08-14', time: '07:00', sec: '07:00:12', type: '지출', cat1: '교통', cat2: '택시', content: '주식회사 티머니', amount: -5600, currency: 'KRW', method: '카카오페이 간편결제', memo: '', ...o });
eq('초가 키에 들어감', L.rowKey(IR()).includes('07:00:12'), true);
eq('같은 분 다른 초는 다른 키', L.rowKey(IR()) !== L.rowKey(IR({ sec: '07:00:43' })), true);
eq('같은 행은 같은 id', L.rowId(IR()), L.rowId(IR()));
eq('금액이 다르면 다른 id', L.rowId(IR()) !== L.rowId(IR({ amount: 5600 })), true);
eq('id에 날짜가 앞에 붙음', L.rowId(IR()).startsWith('2026-08-14_'), true);
eq('해시는 문자열', typeof L.hashStr('가나다'), 'string');

console.log('[이름 정규화]');
eq('회차 번호를 #로', L.normalizeName('867707**70   ,2512-38회차'), '######**## ,####-##회차');
eq('회차가 달라도 같은 키', L.normalizeName('867707**70   ,2512-38회차'), L.normalizeName('867707**70   ,2601-39회차'));
eq('사람 이름은 그대로', L.normalizeName('김*훈'), '김*훈');
eq('규칙 키는 타입별', L.ruleKey('이체', '쿠팡'), '이체|쿠팡');

const IS = { excludeMethods: [], chargeNames: L.BS_DEFAULT_CHARGE, rules: { ...L.BS_DEFAULT_RULES } };
const ic = (o, s = IS) => L.classifyRow(IR(o), s);

console.log('[지출]');
eq('음수 지출 → 지출로 기록', [ic({}).decision, ic({}).amount, ic({}).categoryName], ['record', 5600, '교통']);
eq('양수 지출 → 취소/환불(음수 기록)', [ic({ amount: 5600 }).decision, ic({ amount: 5600 }).amount, ic({ amount: 5600 }).reason], ['record', -5600, 'refund']);
eq('0원은 건너뜀', ic({ amount: 0 }).decision, 'exclude');
eq('대분류 매핑: 온라인쇼핑 → 쇼핑', ic({ cat1: '온라인쇼핑' }).categoryName, '쇼핑');
eq('모르는 대분류 → 기타', ic({ cat1: '없는분류' }).categoryName, '기타');
eq('제외 결제수단', ic({}, { ...IS, excludeMethods: ['카카오페이 간편결제'] }).decision, 'exclude');

console.log('[지출 · 대분류 금융]');
const ifin = (cat2, content = '송금 내역') => ic({ type: '지출', cat1: '금융', cat2, content, amount: -30000 });
eq('송금 내역(카카오페이 N빵) → 기록', [ifin('은행').decision, ifin('은행').amount], ['record', 30000]);
eq('증권/투자 → 제외', ifin('증권/투자', '토스 원규나').decision, 'exclude');
eq('ATM(현금 인출) → 확인', ifin('은행', 'ATM').decision, 'pending');
eq('이자/대출 → 기록', ifin('이자/대출', '토스 김영훈').decision, 'record');
eq('세금/과태료 → 기록', ifin('세금/과태료', '정부24').decision, 'record');

console.log('[이체]');
const itr = (cat1, content, amount, method = 'KB마이핏통장') => ic({ type: '이체', cat1, cat2: '미분류', content, amount, method });
eq('내계좌이체 → 제외', itr('내계좌이체', '정은수', -1800000).decision, 'exclude');
eq('카드대금 → 제외', itr('카드대금', '신한카드', -1551390).decision, 'exclude');
eq('저축·투자 → 제외', [itr('저축', '예금', 1).decision, itr('투자', '무신사머니', -1).decision], ['exclude', 'exclude']);
eq('현금(환전) → 제외', itr('현금', 'JPY로 환전', -999998).decision, 'exclude');
eq('대출 → 제외', itr('대출', '9901 신한카드', 1).decision, 'exclude');
eq('미분류(입금 내역) → 제외', itr('미분류', '입금 내역', 454000).decision, 'exclude');
eq('타인에게 보냄 → 지출', [itr('이체', '김양래', -10000).decision, itr('이체', '김양래', -10000).amount, itr('이체', '김양래', -10000).reason], ['record', 10000, 'sent']);
eq('타인에게 받음 → 환급', [itr('이체', '김*훈', 22666).decision, itr('이체', '김*훈', 22666).amount, itr('이체', '김*훈', 22666).reason], ['record', -22666, 'received']);
eq('N빵 20만원은 자동 기록', itr('이체', '정*원', 200000).decision, 'record');
eq('30만원 이상 이체 → 확인', itr('이체', '임지숙', 49028181).decision, 'pending');
eq('30만원 정확히 → 확인', itr('이체', '누구', 300000).decision, 'pending');
eq('299,999 → 자동 기록', itr('이체', '누구', 299999).decision, 'record');
eq('1원 입금 → 소액 제외', itr('이체', '추운두유', 1).decision, 'exclude');
eq('999원 → 소액 제외', itr('이체', '누구', -999).decision, 'exclude');
eq('1,000원 → 기록', itr('이체', '누구', -1000).decision, 'record');

console.log('[간편결제 충전]');
eq('이체로 들어온 충전 → 제외', itr('이체', '카카오페이', -49799).decision, 'exclude');
eq('내계좌이체로 들어온 충전 → 제외', itr('내계좌이체', '네이버페이충전', -10000).decision, 'exclude');
eq('지출로 들어온 충전도 제외 (타입 무관)', ic({ type: '지출', cat1: '온라인쇼핑', content: '네이버페이충전', amount: -30000 }).decision, 'exclude');
eq('충전 제외가 소액 기준보다 먼저', itr('이체', '충전 내역', 10000).reason, 'charge');

console.log('[학습 규칙]');
const iWithRule = { ...IS, rules: { ...L.BS_DEFAULT_RULES, '이체|쿠팡': { kind: 'record', categoryName: '쇼핑' } } };
eq('쿠팡 충전은 지출로 (쿠팡캐시는 연동 안 됨)', [ic({ type: '이체', cat1: '이체', content: '쿠팡', amount: -100000 }, iWithRule).decision, ic({ type: '이체', cat1: '이체', content: '쿠팡', amount: -100000 }, iWithRule).amount], ['record', 100000]);
eq('같은 이름이라도 지출은 규칙 영향 없음', ic({ type: '지출', cat1: '온라인쇼핑', content: '쿠팡', amount: -8310 }, iWithRule).categoryName, '쇼핑');
eq('회사 입금은 기본 규칙으로 제외', ic({ type: '이체', cat1: '이체', content: '엘지에너지솔루션', amount: 55200 }).decision, 'exclude');
eq('규칙이 큰 이체보다 먼저', ic({ type: '이체', cat1: '이체', content: '엘지에너지솔루션', amount: 5000000 }).decision, 'exclude');
const iNumRule = { ...IS, rules: { '지출|######**## ,####-##회차': { kind: 'exclude' } } };
eq('회차가 달라도 정규화 규칙이 걸림', ic({ type: '지출', cat1: '교육/학습', content: '867707**70   ,2601-39회차', amount: -20000 }, iNumRule).decision, 'exclude');

console.log('[수입]');
eq('급여 → 제외', ic({ type: '수입', cat1: '급여', content: '급여', amount: 2000000 }).decision, 'exclude');
eq('이자 → 제외', ic({ type: '수입', cat1: '금융수입', content: '통장 이자', amount: 120 }).decision, 'exclude');
eq('잡수입 → 제외', ic({ type: '수입', cat1: '기타수입', content: '적립 내역', amount: 2 }).decision, 'exclude');

console.log('[가져오기 계획]');
const irows = [IR(), IR({ sec: '07:00:43' }), IR({ type: '수입', cat1: '급여', amount: 2000000 }), IR({ date: '2026-08-20', amount: -1000 })];
const iplan = L.planImport(irows, IS, new Set());
eq('기간', [iplan.from, iplan.to], ['2026-08-14', '2026-08-20']);
eq('기록 3건 · 제외 1건', [iplan.record.length, iplan.exclude.length, iplan.pending.length], [3, 1, 0]);
eq('지출 합계', iplan.spend, 12200);
const idone = new Set([L.rowId(IR())]);
eq('이미 가져온 건은 건너뜀', L.planImport(irows, IS, idone).already.length, 1);
eq('건너뛴 건은 기록에 없음', L.planImport(irows, IS, idone).record.length, 2);
eq('같은 파일을 두 번 올려도 새로 들어오는 건 없음', L.planImport(irows, IS, new Set(irows.map(L.rowId))).record.length, 0);
eq('결제수단 목록을 뽑아 줌', iplan.methods, ['카카오페이 간편결제']);

console.log('[표 읽기]');
const igrid = [
  ['뱅크샐러드 가계부'],
  [],
  ['날짜', '시간', '타입', '대분류', '소분류', '내용', '금액', '화폐', '결제수단', '메모'],
  [46282, 0.7200115740740741, '이체', '이체', '미분류', '추운두유', 1, 'KRW', '토스뱅크 통장', null],
  [46281, 0.4373842592592592, '지출', '온라인쇼핑', '서비스구독', '네이버플러스멤버십', -4900, 'KRW', '네이버페이 간편결제(머니)', null],
  [null, null, null],
];
const iparsed = L.parseBanksaladRows(igrid);
eq('헤더 줄을 찾아냄', iparsed.length, 2);
eq('첫 행', [iparsed[0].date, iparsed[0].time, iparsed[0].type, iparsed[0].content, iparsed[0].amount], ['2026-09-17', '17:16', '이체', '추운두유', 1]);
eq('빈 날짜 줄은 건너뜀', iparsed.every(r => !!r.date), true);
eq('공유 문자열', L.parseSharedStrings('<sst><si><t>가</t></si><si><r><t>나</t></r><r><t>다</t></r></si></sst>'), ['가', '나다']);
eq('시트 셀 읽기', L.parseSheet('<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>-4900</v></c></row>', ['식비']), [['식비', undefined, -4900]]);


console.log('[주기 넘기기 (v3.1.0)]');
const navTxs=[tx('2026-06-30',1000),tx('2026-09-15',2000)];
eq('가장 이른 주기',L.earliestCycle(navTxs,'2026-09-18').id,'2026-06');
eq('내역이 없으면 이번 주기',L.earliestCycle([],'2026-09-18').id,'2026-08');
eq('이전 주기로 (마지막 날 기준)',L.shiftCycleRef('2026-09-18',-1,'2026-09-18'),'2026-08-24');
eq('두 번 이전',L.shiftCycleRef(L.shiftCycleRef('2026-09-18',-1,'2026-09-18'),-1,'2026-09-18'),'2026-07-24');
eq('다음으로 눌러 이번 주기면 null',L.shiftCycleRef('2026-08-24',1,'2026-09-18'),null);
eq('연말 경계 이전',L.shiftCycleRef('2027-01-10',-1,'2027-01-10'),'2026-12-24');
const pastRef=L.shiftCycleRef('2026-09-18',-1,'2026-09-18');
const pastTxs=[tx('2026-08-01',100000),tx('2026-08-10',200000),tx('2026-08-20',300000),tx('2026-09-01',50000)];
const ps=L.homeStats(pastTxs,cats,pastRef,600000,'2026-09-18');
eq('지난 주기 전체 합계',ps.living,600000);
eq('지난 주기는 주기 전체 일수',ps.elapsed,L.cycleDays(L.cycleOf(pastRef)));
eq('예산 대비 100%',ps.budgetPct,100);
eq('하루 평균',ps.avgDaily,Math.floor(600000/ps.elapsed));
eq('누적 그래프는 주기 끝까지',ps.series.length,ps.elapsed);
eq('지난 주기 볼 때 오늘 쓴 돈은 0',ps.today,0);
eq('예산이 없으면 페이스 없음',L.homeStats(pastTxs,cats,pastRef,null,'2026-09-18').pace,null);
eq('예산이 없으면 비율도 없음',L.homeStats(pastTxs,cats,pastRef,null,'2026-09-18').budgetPct,null);
eq('이번 주기는 오늘까지만 누적',L.homeStats(pastTxs,cats,'2026-09-18',null).series.length,L.cycleOf('2026-09-18').start==='2026-08-25'?25:0);


console.log('[가져오기 알림 (v3.2.0)]');
const D = d => new Date(d + 'T12:00:00+09:00').getTime();
const bs = [{ id: 'b1', importedAt: D('2026-09-04') }, { id: 'b2', importedAt: D('2026-09-11') }];
eq('마지막 가져오기 날짜', L.lastImportYMD(bs), '2026-09-11');
eq('한 번도 안 가져왔으면 null', L.lastImportYMD([]), null);
eq('6일 지남 → 안 알림', L.importDue(bs, '2026-09-17', 7), null);
eq('7일 지남 → 알림', L.importDue(bs, '2026-09-18', 7).level, 'due');
eq('알림에 지난 날수', L.importDue(bs, '2026-09-18', 7).days, 7);
eq('14일 지남 → 강한 알림', L.importDue(bs, '2026-09-25', 7).level, 'late');
eq('알림 끄면 null', L.importDue(bs, '2026-10-30', 0), null);
eq('가져온 적 없으면 알리지 않음', L.importDue([], '2026-09-18', 7), null);
eq('기준을 14일로 바꾸면', [L.importDue(bs, '2026-09-18', 14), L.importDue(bs, '2026-09-26', 14).level], [null, 'due']);

console.log('[내역 일괄 수정 (v3.2.0)]');
const bt = [
  { id: 't1', categoryId: 'a', amount: 10000, kind: 'living', kindSource: 'auto', date: '2026-09-01' },
  { id: 't2', categoryId: 'a', amount: 500000, kind: 'living', kindSource: 'auto', date: '2026-09-02' },
  { id: 't3', categoryId: 'z', amount: 3000, kind: 'living', kindSource: 'auto', date: '2026-09-03' },
];
const mvd = L.bulkSetCategory(bt, ['t1', 't2'], 'g', cm, T, 99);
eq('고른 것만 바뀜', mvd.map(t => t.id), ['t1', 't2']);
eq('카테고리 이동', mvd.every(t => t.categoryId === 'g'), true);
eq('특별지출 카테고리로 옮기면 특별', mvd.map(t => t.kind), ['special', 'special']);
eq('일괄 변경은 질문하지 않음', mvd.every(t => t.kindSource === 'auto'), true);
eq('updatedAt 갱신', mvd[0].updatedAt, 99);
eq('원본은 그대로', bt[0].categoryId, 'a');
const kd = L.bulkSetKind(bt, ['t1', 't3'], 'special', 100);
eq('분류 일괄 전환', kd.map(t => [t.id, t.kind, t.kindSource]), [['t1', 'special', 'manual'], ['t3', 'special', 'manual']]);
eq('수동 전환은 규칙보다 우선', L.resolveKind(kd[0], cm, T).kind, 'special');

console.log('[내역 주기 칩]');
const ct = [tx('2026-09-15', 1), tx('2026-08-01', 1), tx('2026-06-30', 1)];
eq('내역이 있는 주기만 (최근 순)', L.cyclesInData(ct, '2026-09-18').map(c => c.id), ['2026-08', '2026-07', '2026-06']);
eq('이번 주기는 내역이 없어도 포함', L.cyclesInData([tx('2026-06-30', 1)], '2026-09-18').map(c => c.id), ['2026-08', '2026-06']);
eq('개수 제한', L.cyclesInData(ct, '2026-09-18', 2).length, 2);

console.log(`\n${pass} 통과 / ${fail} 실패`);process.exit(fail?1:0);

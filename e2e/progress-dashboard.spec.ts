import { test, expect } from '@playwright/test';
import { seed } from './helpers';
const food=(id:string,date:string,energy:number|null,extra={})=>({id,date,name:'Measured meal',basisAmount:100,basisUnit:'g',quantity:150,nutrients:{energy,protein:10,calcium:null},foodId:id,meal:'Lunch',source:'Manual',updatedAt:1,...extra});
async function records(page:import('@playwright/test').Page){
 const now=new Date('2026-10-04T09:00:00+05:30');await page.clock.install({time:now});await page.clock.pauseAt(now);
 await seed(page,{'vk:weight-loss':{entries:{'2026-09-15':{weightKg:84,updatedAt:1},'2026-10-01':{weightKg:82,updatedAt:1},'2026-10-04':{weightKg:80,updatedAt:1}},recoveryByDay:{},targetKg:78},'vk:nutrition:entries':{a:food('a','2026-10-01',200),b:food('b','2026-10-01',null),c:food('c','2026-10-04',100),d:food('d','2026-10-03',900,{deleted:true})},'vk:workouts':{'2026-10-04':{squat:{done:true,sets:[{reps:8,weightKg:20}]}}},'vk:fasting:water':{'2026-10-04':8}});
}
test('dashboard uses saved records, portion totals and nutrient coverage across selectable ranges',async({page})=>{
 await records(page);await page.goto('/dashboard');const dashboard=page.getByTestId('progress-dashboard');await expect(dashboard).toBeVisible();
 await expect(page.locator('#body')).toContainText('80 kg');await expect(page.locator('#body')).toContainText('-4 kg');await expect(page.locator('#body')).toContainText('78 kg');
 await expect(page.locator('#nutrition')).toContainText('225 kcal');await expect(page.locator('#nutrition')).toContainText('2/30');
 await page.getByRole('group',{name:'Progress range'}).getByRole('button',{name:'7 days',exact:true}).click();
 await expect(page.locator('#body')).toContainText('-2 kg');await expect(page.locator('#nutrition')).toContainText('2/7');await expect(page.locator('#exercise')).toContainText('1 exercise records');
 await page.locator('#nutrition').getByText('All nutrients, coverage and saved targets',{exact:true}).click();
 const calcium=page.locator('#nutrition tr').filter({has:page.getByRole('rowheader',{name:'Calcium',exact:true})});await expect(calcium).toContainText('Not recorded');await expect(calcium).toContainText('0/3 entries');
 await page.locator('#body').getByText('View daily readings · kg',{exact:true}).click();await expect(page.locator('#body table')).toContainText('Not recorded');
});
test('date navigation changes the period and returning to today restores it',async({page})=>{
 await records(page);await page.goto('/dashboard');await page.getByRole('button',{name:'Previous progress period'}).click();await expect(page.getByLabel('Through date')).toHaveValue('2026-09-04');await expect(page.locator('#body')).toContainText('Not recorded');await page.getByRole('button',{name:'Back to today',exact:true}).click();await expect(page.getByLabel('Through date')).toHaveValue('2026-10-04');
});
test('empty progress offers logging without fabricated trends and retains detail navigation',async({page})=>{
 await seed(page);await page.goto('/dashboard');await expect(page.getByRole('heading',{level:1,name:'Progress',exact:true})).toBeVisible();await expect(page.locator('#body')).toContainText('Not recorded');await expect(page.locator('#body svg[role=img]')).toHaveCount(0);await page.locator('#body').getByRole('link',{name:'Log weight',exact:true}).click();await expect(page).toHaveURL(/\/weight-loss$/);await expect(page.getByRole('navigation',{name:'Health sections'})).toBeVisible();await page.getByRole('navigation',{name:'Health sections'}).getByRole('link',{name:'Food',exact:true}).click();await expect(page).toHaveURL(/\/food$/);await expect(page.getByRole('region',{name:'Seven-day progress'})).toContainText('Full progress dashboard');
});
for(const width of [320,390,768,1440]){test(`populated dashboard has no overflow and accessible charts at ${width}px`,async({page})=>{
 await records(page);await page.setViewportSize({width,height:900});await page.goto('/dashboard');await expect(page.getByRole('img',{name:/Weight trend:/})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await page.locator('#nutrition').getByText('All nutrients, coverage and saved targets',{exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});}
test('Plan lets the person choose a task before starting focus without changing the task',async({page})=>{
 const today=new Date().toISOString().slice(0,10);
 await seed(page,{'vk:todos':[{id:'one',text:'First task',done:false,date:today,priority:'P1',tag:'Work',createdAt:1},{id:'two',text:'Second task',done:false,date:today,priority:'P2',tag:'Work',createdAt:2}]});await page.goto('/plan');await page.getByLabel('Focus task',{exact:true}).selectOption('two');await expect(page.getByTestId('focus-sprint')).toContainText('Second task');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('vk:todos')!)[1].done)).toBe(false);
});
test('weight history supports dated corrections and undo without losing other readings',async({page})=>{
 await records(page);await page.goto('/weight-loss');const date=page.getByLabel('Record date',{exact:true});await expect(date).toBeVisible();await date.fill('2026-10-01');await page.getByLabel('Recorded weight',{exact:true}).fill('81');await page.getByRole('button',{name:'Save weigh-in',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved weigh-in');const row=page.getByTestId('weight-history').getByRole('listitem').filter({hasText:'2026-10-01'});await expect(row).toContainText('81 kg');await row.getByRole('button',{name:'Remove'}).click();await page.getByRole('button',{name:'Undo weight removal'}).click();await expect(row).toContainText('81 kg');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('vk:weight-loss')!).entries['2026-10-04'].weightKg)).toBe(80);
});

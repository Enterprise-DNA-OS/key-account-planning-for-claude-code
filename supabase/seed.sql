insert into accounts(id,code,name,owner,currency,objective,review_due) values
('10000000-0000-4000-8000-000000000001','A-001','Harbour Components','Mia','NZD','Agree a second-site service plan',current_date-8),
('10000000-0000-4000-8000-000000000002','A-002','Southern Distribution','Tom','AUD','Confirm the next quarterly priorities',current_date+14),
('10000000-0000-4000-8000-000000000003','A-003','Harbour Services','Mia','NZD','Map the buying group',null)
on conflict do nothing;
insert into stakeholders(id,code,account_id,name,title,owner,influence,stance,purpose,source,verified_on,review_due) values
('20000000-0000-4000-8000-000000000001','S-001','10000000-0000-4000-8000-000000000001','Alex Reed','Operations lead','Mia','influencer','champion','Account service planning','Synthetic meeting note',current_date-120,current_date-5),
('20000000-0000-4000-8000-000000000002','S-002','10000000-0000-4000-8000-000000000002','Alex Hart','Managing director','Tom','decision','neutral','Account review','Synthetic introduction',current_date-7,current_date+180),
('20000000-0000-4000-8000-000000000003','S-003','10000000-0000-4000-8000-000000000001','Morgan Lane','Finance lead','Mia','unknown','unknown','','',null,null)
on conflict do nothing;
insert into coverage(id,code,account_id,business_unit,product,status,competitor,potential_cents,evidence,assessed_on) values
('30000000-0000-4000-8000-000000000001','C-001','10000000-0000-4000-8000-000000000001','North site','Service plan','ours','',null,'Synthetic signed scope',current_date-10),
('30000000-0000-4000-8000-000000000002','C-002','10000000-0000-4000-8000-000000000001','South site','Service plan','unserved','',4800000,'Synthetic planning estimate, not booked revenue',current_date-100),
('30000000-0000-4000-8000-000000000003','C-003','10000000-0000-4000-8000-000000000002','Warehouse','Reporting','competitor','Example incumbent',2400000,'Synthetic review notes',current_date-15),
('30000000-0000-4000-8000-000000000004','C-004','10000000-0000-4000-8000-000000000001','South site','Reporting','unknown','',null,'Awaiting discovery',current_date-1)
on conflict do nothing;
insert into plays(id,code,account_id,name,owner,success_measure,due) values
('40000000-0000-4000-8000-000000000001','P-001','10000000-0000-4000-8000-000000000001','South-site discovery','Mia','Customer confirms need and decision process',current_date+14),
('40000000-0000-4000-8000-000000000002','P-002','10000000-0000-4000-8000-000000000002','Quarterly review','Tom','Customer agrees next review priorities',current_date+7)
on conflict do nothing;
insert into actions(id,code,account_id,play_id,stakeholder_id,name,owner,due) values
('50000000-0000-4000-8000-000000000001','T-001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Confirm South-site decision owner','Mia',current_date-3),
('50000000-0000-4000-8000-000000000002','T-002','10000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Prepare review agenda','Tom',current_date+3)
on conflict do nothing;
insert into interactions(id,stakeholder_id,happened_on,note,actor) values
('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',current_date-45,'Synthetic discussion about a second site','Mia'),
('60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',current_date-7,'Synthetic review preparation call','Tom')
on conflict do nothing;

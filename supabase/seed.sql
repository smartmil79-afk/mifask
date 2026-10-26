-- Sample listings so the site is not empty. Run ONCE after you have signed up and made yourself admin.
-- They are posted by your own account and marked "Sample listing". Delete them before real launch with:
--   delete from ads where description like 'Sample listing.%';
insert into ads(seller_id, title, category, state, price, condition, description, phone, views, created_at)
select s.id, v.title, v.category, v.state, v.price, v.condition, 'Sample listing. ' || v.description, '08121483131', v.views, now() - make_interval(hours => v.hrs)
from (select id from profiles order by is_admin desc, created_at limit 1) s,
(values
 ('Toyota Camry 2012 (Tokunbo), clean','Vehicles','Lagos',3900000,'Used','Foreign used, automatic, AC works, first body, no accidents.',184,2),
 ('Honda Accord 2008 EOD','Vehicles','Abuja (FCT)',2100000,'Used','Engine and gear in good shape, new tyres, duty paid.',96,5),
 ('3-bedroom flat to let, Lekki','Property','Lagos',2800000,'For rent','Newly built and tiled, 24 hour light, prepaid meter. Yearly rent.',241,3),
 ('Plot of land, 600sqm, Ibeju-Lekki','Property','Lagos',8500000,'For sale','Dry land with C of O, ready to build.',133,9),
 ('iPhone 13, 128GB','Phones & Tablets','Abuja (FCT)',520000,'Used','Battery health 89 percent, no cracks, comes with charger.',312,1),
 ('Tecno Spark 20 Pro','Phones & Tablets','Oyo',185000,'Brand new','Sealed box, 256GB, one year warranty.',150,6),
 ('Samsung Galaxy A54, 128GB','Phones & Tablets','Lagos',245000,'Brand new','Dual SIM, original charger and box included.',120,12),
 ('HP EliteBook 840 G5','Electronics','Lagos',295000,'Used','Core i5 8th gen, 16GB RAM, 512GB SSD, light use.',205,4),
 ('Samsung 55-inch Smart TV','Electronics','Rivers',420000,'Brand new','4K UHD with wall bracket. Delivery available.',88,8),
 ('PlayStation 5 with 2 controllers','Electronics','Enugu',560000,'Used','Disc version, 3 games included, works perfectly.',170,7),
 ('Ankara gown, custom sizes','Fashion','Enugu',18500,'Brand new','Made to order within 5 days. Send your measurements.',64,10),
 ('Mens leather loafers, sizes 40 to 46','Fashion','Kano',24000,'Brand new','Handmade genuine leather, comfortable all day.',51,14),
 ('L-shaped sofa set, 7 seater','Home & Garden','Ogun',350000,'Brand new','Quality fabric, free delivery in Abeokuta.',77,11),
 ('Generator 3.5kVA (Sumec Firman)','Home & Garden','Kaduna',260000,'Used','Barely used, key start, recently serviced.',143,13),
 ('Plumbing and pipe fitting','Services','Lagos',15000,'Plumbing, pipe fitting, leak repairs, installations','Same day callout across the mainland. Fair pricing.',99,15),
 ('Home and office cleaning','Services','Abuja (FCT)',20000,'Deep cleaning, laundry, post-construction cleaning','Trained team with their own equipment. Book a day ahead.',72,16),
 ('German Shepherd puppies','Animals','Delta',120000,'Baby','Eight weeks old, vaccinated, both parents on site.',160,17),
 ('Frontend developer (remote)','Jobs','Anambra',400000,'Full-time','Monthly salary. React and CSS. Send your portfolio.',58,18),
 ('Sales assistant wanted','Jobs','Lagos',80000,'Full-time','Retail shop in Ikeja. Honest and punctual. Monthly pay.',45,20)
) as v(title, category, state, price, condition, description, views, hrs);

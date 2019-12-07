# voucherify-hubspot-coupon-distribution
Distribute Voucherify coupons for each Hubspot contacts into property you choose.

**Features list**

- choose your Voucherify campaign you want to publish coupons from - campaigns list automaticly loads into form
- select one of your contact lists from your Hubspot account - lists are loade into form too
- quick search and pick Hubspots contact property to be used as source_id in distribution
- type the name of new property wich will contain contacts coupon code in it's value - with validation

**How it works**

This application is validating contact properties, loading contacts through Hubspot API from selected list and it's loading coupons for each contact using Voucherify API.
At the end it's changing contacts properties to put new coupons over there.
Last part of a coupon distrbution is to create your own email template in Hubspot and use coupon code as property variable.
So, if your property is **voucherifycouponcode**, then use it as **{{voucherifycouponcode}}** in email template.

**App installation and running**

1. Clone this repo to separated directory.
2. Edit app.js - put your Hubspot and Voucherify API secret keys and id's and change the port if you want, default is 80.
3. **npm** i in app directory
4. run **node app.js** or **nodemon app.js** if you have nodemon
5. Enter the app in the internet browser - 127:0:0:1


**Demonstration video**
<a href="https://drive.google.com/open?id=1sMHRpWrnYwSSYiwxxFtj8owdyuv-dCh3">Demonstration video</a>
ملخص جميع APIs لمشروع إدارة الصيدلية
________________________________________
مقدمة
•	المشروع يحتوي على إدارة العملاء، الموردين، المنتجات، الفواتير، المشتريات، المصروفات، والمستخدمين.
•	معظم الروابط تتطلب تسجيل دخول.
•	بعض الروابط محمية فقط للمسؤول (Admin).
________________________________________
APIs
1. Customers
Method	Route	Description	Permissions
GET	/v1/Customers/	الحصول على جميع العملاء	Login
GET	/v1/Customers/getCustomerByID/:id	الحصول على عميل حسب ID	Login
POST	/v1/Customers/	إنشاء عميل جديد	Admin
PATCH	/v1/Customers/:id	تحديث بيانات العميل	Admin
PUT	/v1/Customers/collection/:id	تحصيل رصيد العميل	Admin
PUT	/v1/Customers/addToCustomerBalance/:id	إضافة رصيد للعميل	Admin
2. Suppliers
Method	Route	Description	Permissions
GET	/v1/Suppliers/	الحصول على جميع الموردين	Login
GET	/v1/Suppliers/:id	الحصول على مورد حسب ID	Login
GET	/v1/Suppliers/filter/search	فلترة الموردين	Login
GET	/v1/Suppliers/search	البحث عن الموردين	Login
POST	/v1/Suppliers/	إنشاء مورد جديد	Admin
PUT	/v1/Suppliers/:id	تحديث بيانات المورد	Admin
PUT	/v1/Suppliers/collection/:id	تحصيل رصيد المورد	Admin
PUT	/v1/Suppliers/addToSupplierBalance/:id	إضافة رصيد للمورد	Admin





3. Products
Method	Route	Description	Permissions
GET	/v1/Products/	الحصول على جميع المنتجات	Login
GET	/v1/Products/ProductByID/:id	الحصول على منتج حسب ID	Login
GET	/v1/Products/ProductSearch	فلترة المنتجات	Login
GET	/v1/Products/search	البحث في المنتجات	Login
POST	/v1/Products/	إنشاء منتج جديد	Admin
PATCH	/v1/Products/:id	تحديث بيانات المنتج	Admin
DELETE	/v1/Products/:id	حذف المنتج	Admin
4. Invoices
Method	Route	Description	Permissions
GET	/v1/Invoices/	الحصول على جميع الفواتير	Login
GET	/v1/Invoices/getElementByID/:id	الحصول على فاتورة حسب ID	Login
GET	/v1/Invoices/bestSellers	أفضل المنتجات مبيعاً	Login
PATCH	/v1/Invoices/editInvoice/:id	تعديل الفاتورة	Admin
POST	/v1/Invoices/	إنشاء فاتورة جديدة	Admin
PUT	/v1/Invoices/returnInvoice/:id	تحديث فاتورة مرتجعة	Admin
5. Purchases
Method	Route	Description	Permissions
GET	/v1/Purchases/	الحصول على جميع المشتريات	Login
GET	/v1/Purchases/:id	الحصول على شراء حسب ID	Login
PATCH	/v1/Purchases/:id	تعديل بيانات الشراء	Admin
POST	/v1/Purchases/	إنشاء شراء جديد	Admin
PUT	/v1/Purchases/purchaseReturn/:id	تحديث شراء مرتجع	Admin
6. PurchasesReturn
Method	Route	Description	Permissions
GET	/v1/PurchasesReturn/	الحصول على جميع المرتجعات	Login
GET	/v1/PurchasesReturn/:id	الحصول على مرتجع حسب ID	Login
DELETE	/v1/PurchasesReturn/:id	حذف مرتجع	Admin
7. InvoicesReturn
Method	Route	Description	Permissions
GET	/v1/InvoicesReturn/	الحصول على جميع المرتجعات	Login
GET	/v1/InvoicesReturn/:id	الحصول على مرتجع حسب ID	Login
DELETE	/v1/InvoicesReturn/:id	حذف مرتجع	Admin
8. Expenses
Method	Route	Description	Permissions
GET	/v1/Expenses/	الحصول على جميع المصروفات	Admin
GET	/v1/Expenses/getExpense/:id	الحصول على مصروف حسب ID	Admin
POST	/v1/Expenses/	إنشاء مصروف جديد	Admin
PUT	/v1/Expenses/:id	تعديل المصروف	Admin
DELETE	/v1/Expenses/:id	حذف المصروف	Admin
GET	/v1/Expenses/profit	حساب الأرباح	Admin
9. Users
Method	Route	Description	Permissions
POST	/v1/Users/signUp	إنشاء مستخدم جديد	Public
POST	/v1/Users/login	تسجيل الدخول	Public
GET	/v1/Users/	الحصول على جميع المستخدمين	Login
GET	/v1/Users/getUserById/:id	الحصول على مستخدم حسب ID	Login
PATCH	/v1/Users/:id	تعديل بيانات المستخدم	Login
PUT	/v1/Users/:id	حظر المستخدم	Login
DELETE	/v1/Users/:id	حذف المستخدم	Login
________________________________________
10. Authentication & Middleware
•	protect → Only logged-in users can access.
•	restrictTo(role) → Only specific roles (e.g., admin) can perform certain actions.











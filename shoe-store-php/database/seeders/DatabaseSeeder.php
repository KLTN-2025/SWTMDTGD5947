<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\AuthProvider;
use App\Models\UserProfile;
use App\Models\Category;
use App\Models\Size;
use App\Models\Color;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\OrderStatusLog;
use App\Models\Review;
use App\Models\ChatBoxMessage;
use App\Models\HistoriesChatBox;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Kiểm tra nếu đã có dữ liệu, bỏ qua
        if (Role::count() > 0) {
            $this->command->info('Database đã có dữ liệu. Để seed lại, vui lòng chạy: php artisan migrate:fresh --seed');
            return;
        }

        // 1. Roles (tối thiểu 2, nhưng tạo 3 để đảm bảo)
        $this->seedRoles();

        // 2. Users (tối thiểu 5)
        $users = $this->seedUsers();

        // 3. Auth Providers (cho mỗi user)
        $this->seedAuthProviders($users);

        // 4. User Profiles (cho một số users)
        $this->seedUserProfiles($users);

        // 5. Categories (tối thiểu 5)
        $categories = $this->seedCategories();

        // 6. Sizes (tối thiểu 5)
        $sizes = $this->seedSizes();

        // 7. Colors (tối thiểu 5)
        $colors = $this->seedColors();

        // 8. Products (tối thiểu 5)
        $products = $this->seedProducts();

        // 9. Product Images (cho mỗi product)
        $this->seedProductImages($products);

        // 10. Product Variants (cho mỗi product)
        $productVariants = $this->seedProductVariants($products, $sizes);

        // 11. Category-Product Pivot (many-to-many)
        $this->seedCategoryProduct($products, $categories);

        // 12. Product-Color Pivot (many-to-many)
        $this->seedProductColor($products, $colors);

        // 13. Carts (cho một số users)
        $carts = $this->seedCarts($users);

        // 14. Cart Items (cho một số carts)
        $this->seedCartItems($carts, $productVariants, $colors);

        // 15. Orders (tối thiểu 5)
        $orders = $this->seedOrders($users);

        // 16. Order Items (cho mỗi order)
        $this->seedOrderItems($orders, $productVariants, $colors);

        // 17. Payments (cho mỗi order)
        $this->seedPayments($orders);

        // 18. Order Status Logs (cho một số orders)
        $this->seedOrderStatusLogs($orders, $users);

        // 19. Reviews (tối thiểu 5)
        $this->seedReviews($users, $products);

        // 20. Chat Box Messages (tối thiểu 5)
        $chatBoxes = $this->seedChatBoxMessages($users, $categories);

        // 21. Histories Chat Box (cho mỗi chat box)
        $this->seedHistoriesChatBox($chatBoxes);
    }

    private function seedRoles(): void
    {
        $roles = [
            ['name' => 'ADMIN'],
            ['name' => 'USER'],
            ['name' => 'MODERATOR'],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }

    private function seedUsers(): array
    {
        $adminRole = Role::where('name', 'ADMIN')->first();
        $userRole = Role::where('name', 'USER')->first();

        $users = [
            [
                'name' => 'Admin User',
                'userName' => 'admin',
                'email' => 'admin@example.com',
                'isActive' => true,
                'roleId' => $adminRole->id,
                'imageUrl' => 'users/admin_avatar.png',
            ],
            [
                'name' => 'Nguyễn Văn An',
                'userName' => 'nguyenvanan',
                'email' => 'nguyenvanan@example.com',
                'isActive' => true,
                'roleId' => $userRole->id,
                'imageUrl' => 'users/user1.png',
            ],
            [
                'name' => 'Trần Thị Bình',
                'userName' => 'tranthibinh',
                'email' => 'tranthibinh@example.com',
                'isActive' => true,
                'roleId' => $userRole->id,
                'imageUrl' => 'users/user2.png',
            ],
            [
                'name' => 'Lê Văn Cường',
                'userName' => 'levancuong',
                'email' => 'levancuong@example.com',
                'isActive' => true,
                'roleId' => $userRole->id,
                'imageUrl' => 'users/user3.png',
            ],
            [
                'name' => 'Phạm Thị Dung',
                'userName' => 'phamthidung',
                'email' => 'phamthidung@example.com',
                'isActive' => true,
                'roleId' => $userRole->id,
                'imageUrl' => 'users/user4.png',
            ],
            [
                'name' => 'Hoàng Văn Em',
                'userName' => 'hoangvanem',
                'email' => 'hoangvanem@example.com',
                'isActive' => true,
                'roleId' => $userRole->id,
                'imageUrl' => 'users/user5.png',
            ],
            [
                'name' => 'Vũ Thị Phương',
                'userName' => 'vuthiphuong',
                'email' => 'vuthiphuong@example.com',
                'isActive' => false,
                'roleId' => $userRole->id,
                'imageUrl' => null,
            ],
        ];

        $createdUsers = [];
        foreach ($users as $userData) {
            $createdUsers[] = User::create($userData);
        }

        return $createdUsers;
    }

    private function seedAuthProviders(array $users): void
    {
        foreach ($users as $user) {
            AuthProvider::create([
                'userId' => $user->id,
                'provider' => $user->userName === 'admin' ? 'LOCAL' : (rand(0, 1) ? 'LOCAL' : 'GOOGLE'),
                'providerId' => $user->userName === 'admin' ? null : (rand(0, 1) ? 'google_' . $user->id : null),
                'password' => Hash::make('password123'),
            ]);
        }
    }

    private function seedUserProfiles(array $users): void
    {
        $addresses = [
            '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
            '456 Đường Lê Lợi, Quận 3, TP.HCM',
            '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
            '321 Đường Nguyễn Trãi, Quận 1, TP.HCM',
            '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
            '987 Đường Võ Văn Tần, Quận 3, TP.HCM',
        ];

        $phones = [
            '0901234567',
            '0912345678',
            '0923456789',
            '0934567890',
            '0945678901',
            '0956789012',
        ];

        // Tạo profile cho 5 users đầu tiên
        for ($i = 0; $i < min(5, count($users)); $i++) {
            // Sử dụng DB::table vì migration có 'phone' nhưng model có 'phoneNumber' trong fillable
            DB::table('user_profile')->insert([
                'userId' => $users[$i]->id,
                'phone' => $phones[$i] ?? null,
                'address' => $addresses[$i] ?? null,
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
        }
    }

    private function seedCategories(): array
    {
        $categories = [
            ['name' => 'Giày thể thao', 'parentId' => null],
            ['name' => 'Giày chạy bộ', 'parentId' => null],
            ['name' => 'Giày bóng đá', 'parentId' => null],
            ['name' => 'Giày cao gót', 'parentId' => null],
            ['name' => 'Giày lười', 'parentId' => null],
            ['name' => 'Giày chạy bộ nam', 'parentId' => null], // Sẽ set parentId sau
            ['name' => 'Giày chạy bộ nữ', 'parentId' => null], // Sẽ set parentId sau
        ];

        $createdCategories = [];
        foreach ($categories as $index => $categoryData) {
            $category = Category::create($categoryData);
            $createdCategories[] = $category;

            // Set parentId cho 2 categories cuối
            if ($index >= 5) {
                $parentCategory = $createdCategories[1]; // Giày chạy bộ
                $category->parentId = $parentCategory->id;
                $category->save();
            }
        }

        return $createdCategories;
    }

    private function seedSizes(): array
    {
        $sizes = [
            ['nameSize' => '30', 'description' => 'Size nhỏ - phù hợp cho người có bàn chân nhỏ'],
            ['nameSize' => '31', 'description' => 'Size trung bình - phù hợp cho đa số người dùng'],
            ['nameSize' => '32', 'description' => 'Size lớn - phù hợp cho người có bàn chân lớn'],
            ['nameSize' => '33', 'description' => 'Size S - dành cho trẻ em'],
            ['nameSize' => '34', 'description' => 'Size M - dành cho thanh thiếu niên'],
            ['nameSize' => '35', 'description' => 'Size L - dành cho người có bàn chân lớn'],
            ['nameSize' => '36', 'description' => 'Size XL - dành cho người có bàn chân rất lớn'],
            ['nameSize' => '37', 'description' => 'Size XXL - dành cho người có bàn chân rất rất lớn'],
            ['nameSize' => '38', 'description' => 'Size XXXL - dành cho người có bàn chân rất rất rất lớn'],
            ['nameSize' => '39', 'description' => 'Size XXXXL - dành cho người có bàn chân rất rất rất rất lớn'],
            ['nameSize' => '40', 'description' => 'Size XXXXLL - dành cho người có bàn chân rất rất rất rất rất lớn'],
            ['nameSize' => '41', 'description' => 'Size XXXXLLL - dành cho người có bàn chân rất rất rất rất rất rất lớn'],
            ['nameSize' => '42', 'description' => 'Size XXXXLLLL - dành cho người có bàn chân rất rất rất rất rất rất rất lớn'],
        ];

        $createdSizes = [];
        foreach ($sizes as $sizeData) {
            $createdSizes[] = Size::create($sizeData);
        }

        return $createdSizes;
    }

    private function seedColors(): array
    {
        $colors = [
            ['name' => 'Đen', 'hexCode' => '#000000', 'description' => 'Màu đen cổ điển'],
            ['name' => 'Trắng', 'hexCode' => '#FFFFFF', 'description' => 'Màu trắng tinh khiết'],
            ['name' => 'Đỏ', 'hexCode' => '#FF0000', 'description' => 'Màu đỏ nổi bật'],
            ['name' => 'Xanh dương', 'hexCode' => '#0000FF', 'description' => 'Màu xanh dương trẻ trung'],
            ['name' => 'Xám', 'hexCode' => '#808080', 'description' => 'Màu xám thanh lịch'],
            ['name' => 'Vàng', 'hexCode' => '#FFFF00', 'description' => 'Màu vàng tươi sáng'],
        ];

        $createdColors = [];
        foreach ($colors as $colorData) {
            $createdColors[] = Color::create($colorData);
        }

        return $createdColors;
    }

    private function seedProducts(): array
    {
        $products = [
            [
                'skuId' => 'SKU-001',
                'name' => 'Giày thể thao Nike Air Max',
                'status' => 'IN_STOCK',
                'description' => 'Giày thể thao cao cấp với công nghệ Air Max, phù hợp cho chạy bộ và tập luyện',
                'basePrice' => 2500000,
                'quantity' => 50,
            ],
            [
                'skuId' => 'SKU-002',
                'name' => 'Giày chạy bộ Adidas Ultraboost',
                'status' => 'IN_STOCK',
                'description' => 'Giày chạy bộ với đế Boost siêu êm, hỗ trợ tối đa cho đôi chân',
                'basePrice' => 3200000,
                'quantity' => 30,
            ],
            [
                'skuId' => 'SKU-003',
                'name' => 'Giày bóng đá Puma Future',
                'status' => 'IN_STOCK',
                'description' => 'Giày bóng đá chuyên nghiệp với công nghệ Future, bám sân tốt',
                'basePrice' => 1800000,
                'quantity' => 25,
            ],
            [
                'skuId' => 'SKU-004',
                'name' => 'Giày cao gót nữ Jimmy Choo',
                'status' => 'PRE_SALE',
                'description' => 'Giày cao gót sang trọng, phù hợp cho các dịp đặc biệt',
                'basePrice' => 5000000,
                'quantity' => 10,
            ],
            [
                'skuId' => 'SKU-005',
                'name' => 'Giày lười nam da thật',
                'status' => 'IN_STOCK',
                'description' => 'Giày lười nam làm từ da thật, thoải mái và thanh lịch',
                'basePrice' => 1200000,
                'quantity' => 40,
            ],
            [
                'skuId' => 'SKU-006',
                'name' => 'Giày thể thao New Balance',
                'status' => 'SOLD_OUT',
                'description' => 'Giày thể thao New Balance với thiết kế cổ điển',
                'basePrice' => 2100000,
                'quantity' => 0,
            ],
        ];

        $createdProducts = [];
        foreach ($products as $productData) {
            $createdProducts[] = Product::create($productData);
        }

        return $createdProducts;
    }

    private function seedProductImages(array $products): void
    {
        foreach ($products as $product) {
            // Mỗi product có 2-3 images
            $imageCount = rand(2, 3);
            for ($i = 1; $i <= $imageCount; $i++) {
                ProductImage::create([
                    'productId' => $product->id,
                    'url' => "products/{$product->skuId}_image_{$i}.webp",
                ]);
            }
        }
    }

    private function seedProductVariants(array $products, array $sizes): array
    {
        $productVariants = [];
        
        foreach ($products as $product) {
            // Mỗi product có 2-3 variants với các size khác nhau
            $selectedSizes = array_slice($sizes, 0, rand(2, 3));
            
            foreach ($selectedSizes as $size) {
                // Giá variant có thể khác basePrice một chút
                $priceMultiplier = [0.95, 1.0, 1.05][rand(0, 2)];
                $variantPrice = $product->basePrice * $priceMultiplier;
                
                $variant = ProductVariant::create([
                    'productId' => $product->id,
                    'sizeId' => $size->id,
                    'price' => round($variantPrice, 2),
                    'startDate' => now()->subDays(rand(1, 30)),
                    'endDate' => now()->addDays(rand(30, 365)),
                ]);
                
                $productVariants[] = $variant;
            }
        }

        return $productVariants;
    }

    private function seedCategoryProduct(array $products, array $categories): void
    {
        // Gán mỗi product cho 1-2 categories
        foreach ($products as $product) {
            $selectedCategories = array_slice($categories, 0, rand(1, 2));
            foreach ($selectedCategories as $category) {
                DB::table('category_product')->insert([
                    'categoryId' => $category->id,
                    'productId' => $product->id,
                    'createdAt' => now(),
                    'updatedAt' => now(),
                ]);
            }
        }
    }

    private function seedProductColor(array $products, array $colors): void
    {
        // Gán mỗi product cho 2-4 colors
        foreach ($products as $product) {
            $selectedColors = array_slice($colors, 0, rand(2, 4));
            foreach ($selectedColors as $color) {
                DB::table('product_color')->insert([
                    'productId' => $product->id,
                    'colorId' => $color->id,
                    'createdAt' => now(),
                    'updatedAt' => now(),
                ]);
            }
        }
    }

    private function seedCarts(array $users): array
    {
        $carts = [];
        // Tạo cart cho 5 users đầu tiên (bỏ qua admin)
        $userUsers = array_filter($users, fn($u) => $u->roleId === Role::where('name', 'USER')->first()->id);
        $userUsers = array_slice(array_values($userUsers), 0, 5);
        
        foreach ($userUsers as $user) {
            $carts[] = Cart::create([
                'userId' => $user->id,
            ]);
        }

        return $carts;
    }

    private function seedCartItems(array $carts, array $productVariants, array $colors): void
    {
        foreach ($carts as $cart) {
            // Mỗi cart có 1-3 items
            $itemCount = rand(1, 3);
            $selectedVariants = array_slice($productVariants, 0, $itemCount);
            
            foreach ($selectedVariants as $variant) {
                $selectedColor = $colors[rand(0, count($colors) - 1)];
                
                CartItem::create([
                    'cartId' => $cart->id,
                    'productVariantId' => $variant->id,
                    'colorId' => $selectedColor->id,
                    'quantity' => rand(1, 3),
                ]);
            }
        }
    }

    private function seedOrders(array $users): array
    {
        $orders = [];
        $userUsers = array_filter($users, fn($u) => $u->roleId === Role::where('name', 'USER')->first()->id);
        $userUsers = array_values($userUsers);
        
        $statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
        $paymentMethods = ['CASH', 'CREDIT_CARD', 'E_WALLET', 'BANK_TRANSFER'];
        $paymentStatuses = ['PENDING', 'UNPAID', 'PAID', 'CANCELLED', 'REFUNDED', 'FAILED'];
        
        $addresses = [
            '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
            '456 Đường Lê Lợi, Quận 3, TP.HCM',
            '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
            '321 Đường Nguyễn Trãi, Quận 1, TP.HCM',
            '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
        ];

        for ($i = 0; $i < 5; $i++) {
            $user = $userUsers[$i % count($userUsers)];
            
            $orders[] = Order::create([
                'userId' => $user->id,
                'status' => $statuses[$i % count($statuses)],
                'amount' => rand(2000000, 10000000),
                'deliveryAddress' => $addresses[$i % count($addresses)],
                'paymentMethod' => $paymentMethods[$i % count($paymentMethods)],
                'paymentStatus' => $paymentStatuses[$i % count($paymentStatuses)],
            ]);
        }

        return $orders;
    }

    private function seedOrderItems(array $orders, array $productVariants, array $colors): void
    {
        foreach ($orders as $order) {
            // Mỗi order có 1-4 items
            $itemCount = rand(1, 4);
            $selectedVariants = array_slice($productVariants, 0, $itemCount);
            
            foreach ($selectedVariants as $variant) {
                $selectedColor = $colors[rand(0, count($colors) - 1)];
                $quantity = rand(1, 3);
                
                OrderItem::create([
                    'orderId' => $order->id,
                    'productVariantId' => $variant->id,
                    'colorId' => $selectedColor->id,
                    'quantity' => $quantity,
                    'amount' => $variant->price * $quantity,
                ]);
            }
        }
    }

    private function seedPayments(array $orders): void
    {
        foreach ($orders as $order) {
            $statuses = ['PENDING', 'UNPAID', 'PAID', 'CANCELLED', 'REFUNDED', 'FAILED'];
            $status = $statuses[array_search($order->paymentStatus, $statuses)];
            
            Payment::create([
                'orderId' => $order->id,
                'status' => $status,
                'amount' => $order->amount,
                'transactionCode' => $status === 'PAID' ? 'TXN' . str_pad($order->id, 8, '0', STR_PAD_LEFT) : null,
                'accountNumber' => $status === 'PAID' ? '1234567890' : null,
                'bankCode' => $status === 'PAID' ? 'VCB' : null,
            ]);
        }
    }

    private function seedOrderStatusLogs(array $orders, array $users): void
    {
        $adminUsers = array_filter($users, fn($u) => $u->roleId === Role::where('name', 'ADMIN')->first()->id);
        $adminUsers = array_values($adminUsers);
        
        $statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
        
        // Tạo logs cho 3 orders đầu tiên
        foreach (array_slice($orders, 0, 3) as $order) {
            $oldStatus = null;
            $statusHistory = [];
            
            // Tạo 2-3 status changes
            for ($i = 0; $i < rand(2, 3); $i++) {
                $newStatus = $statuses[rand(0, count($statuses) - 1)];
                if ($newStatus !== $oldStatus) {
                    $statusHistory[] = [
                        'oldStatus' => $oldStatus,
                        'newStatus' => $newStatus,
                    ];
                    $oldStatus = $newStatus;
                }
            }
            
            foreach ($statusHistory as $change) {
                OrderStatusLog::create([
                    'orderId' => $order->id,
                    'oldStatus' => $change['oldStatus'],
                    'newStatus' => $change['newStatus'],
                    'changedBy' => $adminUsers[0]->id ?? null,
                    'note' => 'Status changed by admin',
                ]);
            }
        }
    }

    private function seedReviews(array $users, array $products): void
    {
        $userUsers = array_filter($users, fn($u) => $u->roleId === Role::where('name', 'USER')->first()->id);
        $userUsers = array_values($userUsers);
        
        $comments = [
            'Sản phẩm rất tốt, chất lượng cao!',
            'Giao hàng nhanh, đóng gói cẩn thận.',
            'Giày đẹp nhưng hơi chật một chút.',
            'Rất hài lòng với sản phẩm này.',
            'Giá cả hợp lý, chất lượng ổn.',
            'Sản phẩm đúng như mô tả.',
            'Đáng giá tiền, sẽ mua lại.',
        ];

        // Tạo ít nhất 5 reviews
        for ($i = 0; $i < 5; $i++) {
            $user = $userUsers[$i % count($userUsers)];
            $product = $products[$i % count($products)];
            
            Review::create([
                'userId' => $user->id,
                'productId' => $product->id,
                'rating' => rand(3, 5) + (rand(0, 9) / 10), // 3.0 - 5.9
                'comment' => $comments[$i % count($comments)],
            ]);
        }
    }

    private function seedChatBoxMessages(array $users, array $categories): array
    {
        $userUsers = array_filter($users, fn($u) => $u->roleId === Role::where('name', 'USER')->first()->id);
        $userUsers = array_values($userUsers);
        
        $modes = ['auto_answer', 'shoe_advisor', 'size_support', 'order_support'];
        
        $chatBoxes = [];
        for ($i = 0; $i < 5; $i++) {
            $user = $userUsers[$i % count($userUsers)];
            $category = rand(0, 1) ? $categories[rand(0, count($categories) - 1)] : null;
            
            $chatBoxes[] = ChatBoxMessage::create([
                'userId' => $user->id,
                'categoryId' => $category?->id,
                'mode' => $modes[$i % count($modes)],
            ]);
        }

        return $chatBoxes;
    }

    private function seedHistoriesChatBox(array $chatBoxes): void
    {
        $userMessages = [
            'Xin chào, tôi muốn tư vấn về giày thể thao',
            'Bạn có giày size 42 không?',
            'Giày này có màu đen không?',
            'Tôi muốn đặt hàng sản phẩm này',
            'Giá của sản phẩm này là bao nhiêu?',
        ];

        $assistantMessages = [
            'Xin chào! Tôi có thể giúp gì cho bạn về giày thể thao?',
            'Có ạ, chúng tôi có nhiều mẫu giày size 42. Bạn muốn xem mẫu nào?',
            'Có ạ, sản phẩm này có màu đen. Bạn có muốn xem thêm màu khác không?',
            'Tuyệt vời! Bạn có thể thêm sản phẩm vào giỏ hàng và tiến hành thanh toán.',
            'Giá của sản phẩm này là 2,500,000 VNĐ. Bạn có muốn đặt hàng không?',
        ];

        foreach ($chatBoxes as $index => $chatBox) {
            // Mỗi chat box có 2-4 messages
            $messageCount = rand(2, 4);
            
            for ($i = 0; $i < $messageCount; $i++) {
                $isUser = $i % 2 === 0;
                $messageIndex = ($index * 2 + $i) % count($userMessages);
                
                HistoriesChatBox::create([
                    'chatBoxId' => $chatBox->id,
                    'context' => $isUser ? 'user' : 'assistant',
                    'message' => $isUser ? $userMessages[$messageIndex] : $assistantMessages[$messageIndex],
                ]);
            }
        }
    }
}

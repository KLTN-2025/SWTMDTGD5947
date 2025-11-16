<?php
namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class CartService {
  protected $userModel;
  public function __construct(User $userModel) {
    $this->userModel = $userModel;
  }

  public function addTocart ($user, $request) {
    $userResult = $this->checkExistUser($user->email);
    if(!$userResult['isUser']) {
      return $userResult['response'];
    }

    $validationResult = $this->validateDataCart($request);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $addResult = $this->performAddToCart($user, $request, $validationResult['productVariant']);
    if (!$addResult['isAdded']) {
      return $addResult['response'];
    }

    return $addResult['response'];
  }

  private function checkExistUser ($email) {
    $user = $this->userModel->checkUserExsis($email);
    if(!$user) {
      return [
        'isUser' => false,
        'response' => [
          'code' => HttpCode::NOT_FOUND,
          'status' => false,
          'msgCode' => MsgCode::NOT_FOUND,
          'message' => 'Không tìm thấy thông tin user'
        ]
      ];
    }

    return ['isUser' => true];
  }

  private function validateDataCart($request) {
    if (!$request->has('productVariantId') || empty($request->productVariantId)) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'productVariantId là bắt buộc'
        ]
      ];
    }

    if (!$request->has('quantity') || empty($request->quantity)) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'quantity là bắt buộc'
        ]
      ];
    }

    if (!is_numeric($request->quantity) || $request->quantity <= 0) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'quantity phải là số nguyên dương'
        ]
      ];
    }

    $productVariant = ProductVariant::with(['product', 'size'])->find($request->productVariantId);
    if (!$productVariant) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::NOT_FOUND,
          'status' => false,
          'msgCode' => MsgCode::NOT_FOUND,
          'message' => 'Không tìm thấy sản phẩm'
        ]
      ];
    }

    $now = now();
    if ($productVariant->startDate && $now->lt($productVariant->startDate)) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'Sản phẩm chưa được bán'
        ]
      ];
    }

    if ($productVariant->endDate && $now->gt($productVariant->endDate)) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'Sản phẩm đã hết hạn bán'
        ]
      ];
    }

    // Kiểm tra tồn kho
    $product = $productVariant->product;
    $requestedQuantity = (int)$request->quantity;
    
    if ($requestedQuantity > $product->quantity) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} sản phẩm"
        ]
      ];
    }

    return [
      'isValid' => true,
      'productVariant' => $productVariant
    ];
  }

  private function performAddToCart($user, $request, $productVariant) {
    try {
      return DB::transaction(function () use ($user, $request, $productVariant) {
        // Tìm hoặc tạo cart cho user
        $cart = Cart::firstOrCreate(['userId' => $user->id]);

        // Kiểm tra xem sản phẩm đã có trong cart chưa
        $existingCartItem = CartItem::where('cartId', $cart->id)
          ->where('productVariantId', $request->productVariantId)
          ->first();

        if ($existingCartItem) {
          // Nếu đã có, kiểm tra tổng quantity không vượt quá tồn kho
          $newTotalQuantity = $existingCartItem->quantity + $request->quantity;
          $product = $productVariant->product;
          
          if ($newTotalQuantity > $product->quantity) {
            return [
              'isAdded' => false,
              'response' => [
                'code' => HttpCode::BAD_REQUEST,
                'status' => false,
                'msgCode' => MsgCode::VALIDATION_ERROR,
                'message' => "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} sản phẩm. Bạn đã có {$existingCartItem->quantity} trong giỏ hàng."
              ]
            ];
          }
          
          // Cộng thêm quantity
          $existingCartItem->quantity = $newTotalQuantity;
          $existingCartItem->save();
          $cartItem = $existingCartItem;
        } else {
          // Nếu chưa có, tạo mới
          $cartItem = CartItem::create([
            'cartId' => $cart->id,
            'productVariantId' => $request->productVariantId,
            'quantity' => $request->quantity
          ]);
        }

        // Load relationships cho response
        $cartItem->load([
          'productVariant.product.images',
          'productVariant.product.categories',
          'productVariant.size'
        ]);
        
        // Đếm tổng số items trong cart
        $totalItems = CartItem::where('cartId', $cart->id)->sum('quantity');

        return [
          'isAdded' => true,
          'response' => [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Đã thêm sản phẩm vào giỏ hàng',
            'data' => [
              'cartId' => $cart->id,
              'cartItem' => $cartItem,
              'totalItems' => $totalItems
            ]
          ]
        ];
      });
    } catch (Exception $e) {
      Log::error('Add to cart failed: ' . $e->getMessage());
      return [
        'isAdded' => false,
        'response' => [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Thêm vào giỏ hàng thất bại'
        ]
      ];
    }
  }

  // ============================================================================
  // GET CART ITEMS
  // ============================================================================
  
  public function getCartItems($user) {
    try {
      $cart = Cart::where('userId', $user->id)->first();
      
      if (!$cart) {
        return [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Giỏ hàng trống',
          'data' => [
            'cartItems' => [],
            'totalItems' => 0,
            'totalAmount' => 0
          ]
        ];
      }

      $cartItems = CartItem::where('cartId', $cart->id)
        ->with([
          'productVariant.product.images',
          'productVariant.product.categories', 
          'productVariant.size'
        ])
        ->get();

      // Tính toán thông tin tổng hợp
      $totalItems = $cartItems->sum('quantity');
      $totalAmount = $cartItems->sum(function ($item) {
        return $item->quantity * $item->productVariant->price;
      });

      // Thêm thông tin bổ sung cho từng cart item
      $cartItems->each(function ($item) {
        // Thêm thông tin tính toán
        $item->itemTotal = $item->quantity * $item->productVariant->price;
        
        // Kiểm tra trạng thái sản phẩm
        $product = $item->productVariant->product;
        $item->productStatus = [
          'isAvailable' => $product->status === 'IN_STOCK',
          'status' => $product->status,
          'isDeleted' => $product->trashed()
        ];

        // Lấy ảnh chính của sản phẩm
        $item->mainImage = $product->images->first()?->fullUrl ?? null;
        
        // Kiểm tra thời gian bán của variant
        $now = now();
        $variant = $item->productVariant;
        $item->variantStatus = [
          'isInSalePeriod' => (!$variant->startDate || $now->gte($variant->startDate)) && 
                            (!$variant->endDate || $now->lte($variant->endDate)),
          'startDate' => $variant->startDate,
          'endDate' => $variant->endDate
        ];
      });

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Lấy giỏ hàng thành công',
        'data' => [
          'cartId' => $cart->id,
          'cartItems' => $cartItems,
          'totalItems' => $totalItems,
          'totalAmount' => $totalAmount,
          'summary' => [
            'itemCount' => $cartItems->count(),
            'totalQuantity' => $totalItems,
            'totalAmount' => $totalAmount,
            'currency' => 'VND'
          ]
        ]
      ];
    } catch (Exception $e) {
      Log::error('Get cart items failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::SERVER_ERROR,
        'status' => false,
        'msgCode' => MsgCode::SERVER_ERROR,
        'message' => 'Lấy giỏ hàng thất bại'
      ];
    }
  }

  // ============================================================================
  // UPDATE CART ITEM
  // ============================================================================
  
  public function updateCartItem($user, $cartItemId, $request) {
    // Tìm cart item trước
    $cartItemResult = $this->findUserCartItem($user, $cartItemId);
    if (!$cartItemResult['isFound']) {
      return $cartItemResult['response'];
    }

    // Validate với cartItem để kiểm tra tồn kho
    $validationResult = $this->validateUpdateCartItem($request, $cartItemResult['cartItem']);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $updateResult = $this->performUpdateCartItem($cartItemResult['cartItem'], $request);
    if (!$updateResult['isUpdated']) {
      return $updateResult['response'];
    }

    return $updateResult['response'];
  }

  private function validateUpdateCartItem($request, $cartItem = null) {
    if (!$request->has('quantity') || empty($request->quantity)) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'quantity là bắt buộc'
        ]
      ];
    }

    if (!is_numeric($request->quantity) || $request->quantity <= 0) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => 'quantity phải là số nguyên dương'
        ]
      ];
    }

    // Kiểm tra tồn kho nếu có cartItem
    if ($cartItem) {
      $product = $cartItem->productVariant->product;
      $requestedQuantity = (int)$request->quantity;
      
      if ($requestedQuantity > $product->quantity) {
        return [
          'isValid' => false,
          'response' => [
            'code' => HttpCode::BAD_REQUEST,
            'status' => false,
            'msgCode' => MsgCode::VALIDATION_ERROR,
            'message' => "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} sản phẩm"
          ]
        ];
      }
    }

    return ['isValid' => true];
  }

  private function findUserCartItem($user, $cartItemId) {
    try {
      $cart = Cart::where('userId', $user->id)->first();
      
      if (!$cart) {
        return [
          'isFound' => false,
          'response' => [
            'code' => HttpCode::NOT_FOUND,
            'status' => false,
            'msgCode' => MsgCode::NOT_FOUND,
            'message' => 'Không tìm thấy giỏ hàng'
          ]
        ];
      }

      $cartItem = CartItem::where('id', $cartItemId)
        ->where('cartId', $cart->id)
        ->with([
          'productVariant.product.images',
          'productVariant.product.categories',
          'productVariant.size'
        ])
        ->first();

      if (!$cartItem) {
        return [
          'isFound' => false,
          'response' => [
            'code' => HttpCode::NOT_FOUND,
            'status' => false,
            'msgCode' => MsgCode::NOT_FOUND,
            'message' => 'Không tìm thấy sản phẩm trong giỏ hàng'
          ]
        ];
      }

      return [
        'isFound' => true,
        'cartItem' => $cartItem
      ];
    } catch (Exception $e) {
      Log::error('Find cart item failed: ' . $e->getMessage());
      return [
        'isFound' => false,
        'response' => [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Lỗi khi tìm sản phẩm trong giỏ hàng'
        ]
      ];
    }
  }

  private function performUpdateCartItem($cartItem, $request) {
    try {
      $cartItem->quantity = $request->quantity;
      $cartItem->save();

      return [
        'isUpdated' => true,
        'response' => [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Cập nhật giỏ hàng thành công',
          'data' => [
            'cartItem' => $cartItem
          ]
        ]
      ];
    } catch (Exception $e) {
      Log::error('Update cart item failed: ' . $e->getMessage());
      return [
        'isUpdated' => false,
        'response' => [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Cập nhật giỏ hàng thất bại'
        ]
      ];
    }
  }

  // ============================================================================
  // DELETE CART ITEM
  // ============================================================================
  
  public function deleteCartItem($user, $cartItemId) {
    $cartItemResult = $this->findUserCartItem($user, $cartItemId);
    if (!$cartItemResult['isFound']) {
      return $cartItemResult['response'];
    }

    $deleteResult = $this->performDeleteCartItem($cartItemResult['cartItem']);
    if (!$deleteResult['isDeleted']) {
      return $deleteResult['response'];
    }

    return $deleteResult['response'];
  }

  private function performDeleteCartItem($cartItem) {
    try {
      $cartItem->delete(); // Soft delete

      return [
        'isDeleted' => true,
        'response' => [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Xóa sản phẩm khỏi giỏ hàng thành công'
        ]
      ];
    } catch (Exception $e) {
      Log::error('Delete cart item failed: ' . $e->getMessage());
      return [
        'isDeleted' => false,
        'response' => [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Xóa sản phẩm khỏi giỏ hàng thất bại'
        ]
      ];
    }
  }

  // ============================================================================
  // CLEAR CART
  // ============================================================================
  
  public function clearCart($user) {
    try {
      $cart = Cart::where('userId', $user->id)->first();
      
      if (!$cart) {
        return [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Giỏ hàng đã trống'
        ];
      }

      // Soft delete tất cả cart items
      CartItem::where('cartId', $cart->id)->delete();

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Xóa toàn bộ giỏ hàng thành công'
      ];
    } catch (Exception $e) {
      Log::error('Clear cart failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::SERVER_ERROR,
        'status' => false,
        'msgCode' => MsgCode::SERVER_ERROR,
        'message' => 'Xóa giỏ hàng thất bại'
      ];
    }
  }
}

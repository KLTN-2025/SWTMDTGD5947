<?php

namespace App\Http\Controllers;

use App\services\ShareService;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    protected $shareService;

    public function __construct(ShareService $shareService)
    {
        $this->shareService = $shareService;
    }

    /**
     * GET /api/products/{id}/share - Lấy link chia sẻ sản phẩm
     */
    public function getProductShareLinks($id)
    {
        $result = $this->shareService->getProductShareLinks($id);
        return response()->json($result, $result['code']);
    }
}

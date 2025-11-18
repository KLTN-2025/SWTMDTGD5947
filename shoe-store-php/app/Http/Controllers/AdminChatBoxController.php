<?php

namespace App\Http\Controllers;

use App\Helper\HttpCode;
use App\services\AdminChatBoxService;
use Illuminate\Http\Request;

class AdminChatBoxController extends Controller
{
    protected AdminChatBoxService $chatBoxService;

    public function __construct(AdminChatBoxService $chatBoxService)
    {
        $this->chatBoxService = $chatBoxService;
    }

    public function index(Request $request)
    {
        $result = $this->chatBoxService->listConversations($request);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }

    public function show(int $chatBoxId)
    {
        $result = $this->chatBoxService->getConversationDetail($chatBoxId);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }

    public function destroy(int $chatBoxId)
    {
        $result = $this->chatBoxService->deleteConversation($chatBoxId);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }
}


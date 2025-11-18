<?php

namespace App\Http\Controllers;

use App\Helper\HttpCode;
use App\services\ChatBoxService;
use Illuminate\Http\Request;

class ChatBoxController extends Controller
{
    protected ChatBoxService $chatBoxService;

    public function __construct(ChatBoxService $chatBoxService)
    {
        $this->chatBoxService = $chatBoxService;
    }

    public function sendMessage(Request $request)
    {
        $user = $request->user();
        $result = $this->chatBoxService->sendMessage($user, $request);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }

    public function listSessions(Request $request)
    {
        $user = $request->user();
        $result = $this->chatBoxService->getUserChatBoxes($user);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }

    public function showSession(Request $request, int $chatBoxId)
    {
        $user = $request->user();
        $result = $this->chatBoxService->getChatBoxDetail($user, $chatBoxId);
        return response()->json($result, $result['code'] ?? HttpCode::SUCCESS);
    }
}


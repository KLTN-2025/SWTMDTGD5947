<?php

namespace App\Http\Controllers;

use App\services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        $result = $this->userService->getAllUsers($request);
        return response()->json($result);
    }

    public function show($id)
    {
        $result = $this->userService->getUserById($id);
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $result = $this->userService->createUser($request);
        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $result = $this->userService->updateUser($id, $request);
        return response()->json($result);
    }

    public function destroy($id)
    {
        $result = $this->userService->deleteUser($id);
        return response()->json($result);
    }

    public function search(Request $request)
    {
        $result = $this->userService->searchUsers($request);
        return response()->json($result);
    }
}

<?php

namespace App\Http\Controllers;

use App\services\ProfileService;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    protected $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function getProfile(Request $request)
    {
        $user = $request->user();
        $result = $this->profileService->getProfile($user->id);
        return response()->json($result);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $result = $this->profileService->updateProfile($request, $user->id);
        return response()->json($result);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $result = $this->profileService->changePassword($request, $user->id);
        return response()->json($result);
    }
}

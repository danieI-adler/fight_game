using UnityEngine;

namespace FightGame.Combat
{
    public enum FighterState
    {
        Idle,
        WalkForward,
        WalkBack,
        Jump,
        Crouch,
        Block,
        CrouchBlock,
        DashForward,
        DashBack,
        LightPunch,
        HeavyPunch,
        LightKick,
        HeavyKick,
        CrouchPunch,
        CrouchKick,
        JumpPunch,
        JumpKick,
        SpecialMove,
        SuperMove,
        Hurt,
        Knockdown,
        Victory,
        Defeat
    }
}

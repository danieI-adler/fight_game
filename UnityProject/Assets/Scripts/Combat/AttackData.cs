using System;
using UnityEngine;

namespace FightGame.Combat
{
    [System.Serializable]
    public class AttackData
    {
        public string attackName;
        public FighterState targetState;
        public float startupTime = 0.08f;
        public float activeTime = 0.15f;
        public float recoveryTime = 0.12f;
        public float damage = 50f;
        public float hitstunDuration = 0.25f;
        public float blockstunDuration = 0.15f;
        public float knockback = 5f;
        public bool isHeavy = false;
        public bool causesKnockdown = false;
        public Vector2 hitboxOffset;
        public Vector2 hitboxSize = new Vector2(1f, 0.6f);
    }
}

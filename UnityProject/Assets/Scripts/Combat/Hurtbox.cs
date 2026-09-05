using UnityEngine;

namespace FightGame.Combat
{
    [RequireComponent(typeof(BoxCollider))]
    public class Hurtbox : MonoBehaviour
    {
        public FighterController owner;
        public bool isCrouching = false;

        private void Awake()
        {
            BoxCollider col = GetComponent<BoxCollider>();
            col.isTrigger = true;
        }

        public void TakeHit(AttackData attack, FighterController attacker)
        {
            if (owner != null)
            {
                owner.OnReceiveHit(attack, attacker);
            }
        }
    }
}

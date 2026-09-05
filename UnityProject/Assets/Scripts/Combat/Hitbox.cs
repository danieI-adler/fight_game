using UnityEngine;

namespace FightGame.Combat
{
    public class Hitbox : MonoBehaviour
    {
        public FighterController owner;
        public AttackData attackData;
        private BoxCollider boxCollider;

        private void Awake()
        {
            boxCollider = GetComponent<BoxCollider>();
            if (boxCollider == null)
            {
                boxCollider = gameObject.AddComponent<BoxCollider>();
            }
            boxCollider.isTrigger = true;
            gameObject.SetActive(false);
        }

        public void Activate(AttackData data, int facingDirection)
        {
            attackData = data;
            transform.localPosition = new Vector3(data.hitboxOffset.x * facingDirection, data.hitboxOffset.y, 0);
            boxCollider.size = new Vector3(data.hitboxSize.x, data.hitboxSize.y, 1.5f);
            gameObject.SetActive(true);
        }

        public void Deactivate()
        {
            gameObject.SetActive(false);
        }

        private void OnTriggerEnter(Collider other)
        {
            Hurtbox hurtbox = other.GetComponent<Hurtbox>();
            if (hurtbox != null && hurtbox.owner != owner)
            {
                hurtbox.TakeHit(attackData, owner);
            }
        }
    }
}

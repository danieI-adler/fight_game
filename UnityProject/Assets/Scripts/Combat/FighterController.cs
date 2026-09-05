using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using FightGame.Data;

namespace FightGame.Combat
{
    [RequireComponent(typeof(CharacterController))]
    public class FighterController : MonoBehaviour
    {
        [Header("Configurações do Lutador")]
        public CharacterData characterData;
        public bool isPlayer2 = false;
        public int facingDirection = 1; // 1 = Direita, -1 = Esquerda
        public FighterController opponent;

        [Header("Estado Atual")]
        public FighterState currentState = FighterState.Idle;
        public float currentHealth;
        public float currentEnergy;
        public int comboCounter = 0;

        [Header("Componentes")]
        public Hitbox activeHitbox;
        public Animator animator;
        private CharacterController controller;

        [Header("Física e Movimento")]
        private Vector3 moveVelocity;
        public float gravity = -35f;
        public bool isGrounded = true;
        private float hitstunTimer = 0f;
        private float stateTimer = 0f;

        [Header("Lista de Golpes")]
        public List<AttackData> attacks = new List<AttackData>();

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            if (characterData != null)
            {
                currentHealth = characterData.maxHealth;
            }
            currentEnergy = 0f;
        }

        private void Start()
        {
            facingDirection = isPlayer2 ? -1 : 1;
            UpdateFacingRotation();
        }

        private void Update()
        {
            isGrounded = controller.isGrounded;
            stateTimer += Time.deltaTime;

            if (hitstunTimer > 0)
            {
                hitstunTimer -= Time.deltaTime;
                if (hitstunTimer <= 0 && currentState == FighterState.Hurt)
                {
                    ChangeState(FighterState.Idle);
                }
            }

            AutoFaceOpponent();
            ApplyMovementAndGravity();
            UpdateAnimator();
        }

        public void HandleInput(float horizontalInput, bool crouch, bool jump, bool lightPunch, bool heavyPunch, bool lightKick, bool heavyKick, bool special, bool superMove)
        {
            if (hitstunTimer > 0 || currentState == FighterState.Knockdown || currentState == FighterState.Defeat) return;

            // Bloqueio
            bool isHoldingBack = (facingDirection == 1 && horizontalInput < -0.1f) || (facingDirection == -1 && horizontalInput > 0.1f);
            if (isHoldingBack && isGrounded)
            {
                ChangeState(crouch ? FighterState.CrouchBlock : FighterState.Block);
                return;
            }

            // Ataques
            if (superMove && currentEnergy >= 100f)
            {
                ExecuteAttack(FighterState.SuperMove);
                currentEnergy = 0f;
                return;
            }

            if (special && currentEnergy >= 25f)
            {
                ExecuteAttack(FighterState.SpecialMove);
                currentEnergy -= 25f;
                return;
            }

            if (lightPunch) { ExecuteAttack(crouch ? FighterState.CrouchPunch : (isGrounded ? FighterState.LightPunch : FighterState.JumpPunch)); return; }
            if (heavyPunch) { ExecuteAttack(isGrounded ? FighterState.HeavyPunch : FighterState.JumpPunch); return; }
            if (lightKick) { ExecuteAttack(crouch ? FighterState.CrouchKick : (isGrounded ? FighterState.LightKick : FighterState.JumpKick)); return; }
            if (heavyKick) { ExecuteAttack(isGrounded ? FighterState.HeavyKick : FighterState.JumpKick); return; }

            // Movimento e Pulo
            if (isGrounded)
            {
                if (jump)
                {
                    moveVelocity.y = characterData != null ? characterData.jumpForce : 14f;
                    ChangeState(FighterState.Jump);
                }
                else if (crouch)
                {
                    ChangeState(FighterState.Crouch);
                    moveVelocity.x = 0;
                }
                else if (Mathf.Abs(horizontalInput) > 0.1f)
                {
                    float speed = characterData != null ? characterData.moveSpeed : 7f;
                    moveVelocity.x = horizontalInput * speed;
                    bool movingForward = (facingDirection == 1 && horizontalInput > 0) || (facingDirection == -1 && horizontalInput < 0);
                    ChangeState(movingForward ? FighterState.WalkForward : FighterState.WalkBack);
                }
                else
                {
                    moveVelocity.x = 0;
                    ChangeState(FighterState.Idle);
                }
            }
        }

        private void ExecuteAttack(FighterState state)
        {
            AttackData attack = attacks.Find(a => a.targetState == state);
            if (attack == null)
            {
                attack = new AttackData { targetState = state, damage = 50f, activeTime = 0.2f, startupTime = 0.08f };
            }

            StartCoroutine(AttackCoroutine(attack));
        }

        private IEnumerator AttackCoroutine(AttackData attack)
        {
            ChangeState(attack.targetState);
            moveVelocity.x = 0;

            yield return new WaitForSeconds(attack.startupTime);

            if (activeHitbox != null)
            {
                activeHitbox.Activate(attack, facingDirection);
            }

            yield return new WaitForSeconds(attack.activeTime);

            if (activeHitbox != null)
            {
                activeHitbox.Deactivate();
            }

            yield return new WaitForSeconds(attack.recoveryTime);

            if (currentState == attack.targetState)
            {
                ChangeState(FighterState.Idle);
            }
        }

        public void OnReceiveHit(AttackData attack, FighterController attacker)
        {
            bool isBlocking = currentState == FighterState.Block || currentState == FighterState.CrouchBlock;

            if (isBlocking)
            {
                // Bloqueio absorve 80% do dano e não dá energia
                float chipDamage = (attack.damage * 0.2f) * (attacker.characterData != null ? attacker.characterData.attackMultiplier : 1f);
                currentHealth = Mathf.Max(0, currentHealth - chipDamage);
                hitstunTimer = attack.blockstunDuration;
                ApplyKnockback(attack.knockback * 0.4f, attacker.facingDirection);
            }
            else
            {
                float fullDamage = attack.damage * (attacker.characterData != null ? attacker.characterData.attackMultiplier : 1f);
                currentHealth = Mathf.Max(0, currentHealth - fullDamage);

                // Ganha 2.5% de energia ao apanhar, atacante ganha 5%
                currentEnergy = Mathf.Min(100f, currentEnergy + 2.5f);
                attacker.currentEnergy = Mathf.Min(100f, attacker.currentEnergy + 5.0f);
                attacker.comboCounter++;

                hitstunTimer = attack.hitstunDuration;
                ApplyKnockback(attack.knockback, attacker.facingDirection);
                ChangeState(attack.causesKnockdown ? FighterState.Knockdown : FighterState.Hurt);
            }

            if (currentHealth <= 0)
            {
                ChangeState(FighterState.Defeat);
                if (attacker != null) attacker.ChangeState(FighterState.Victory);
            }
        }

        private void ApplyKnockback(float force, int direction)
        {
            moveVelocity.x = force * direction;
        }

        private void ApplyMovementAndGravity()
        {
            if (isGrounded && moveVelocity.y < 0)
            {
                moveVelocity.y = -2f;
            }
            else
            {
                moveVelocity.y += gravity * Time.deltaTime;
            }

            controller.Move(moveVelocity * Time.deltaTime);
            moveVelocity.x = Mathf.Lerp(moveVelocity.x, 0, Time.deltaTime * 8f);
        }

        private void AutoFaceOpponent()
        {
            if (opponent == null || currentState == FighterState.Hurt || currentState == FighterState.Knockdown) return;

            int desiredFacing = (opponent.transform.position.x > transform.position.x) ? 1 : -1;
            if (desiredFacing != facingDirection && isGrounded && (currentState == FighterState.Idle || currentState == FighterState.WalkForward || currentState == FighterState.WalkBack))
            {
                facingDirection = desiredFacing;
                UpdateFacingRotation();
            }
        }

        private void UpdateFacingRotation()
        {
            transform.rotation = Quaternion.Euler(0, facingDirection == 1 ? 90 : -90, 0);
        }

        public void ChangeState(FighterState newState)
        {
            if (currentState == newState) return;
            currentState = newState;
            stateTimer = 0f;
        }

        private void UpdateAnimator()
        {
            if (animator == null) return;
            animator.SetInteger("State", (int)currentState);
            animator.SetBool("IsGrounded", isGrounded);
        }
    }
}

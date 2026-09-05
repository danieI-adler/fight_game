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
            currentHealth = characterData != null ? characterData.maxHealth : 1000f;
            currentEnergy = 0f;
        }

        [Header("Hierarquia Visual")]
        public Transform modelRoot;
        private Vector3 initialModelLocalPos;
        private Quaternion initialModelLocalRot;

        private void Start()
        {
            if (currentHealth <= 0)
            {
                currentHealth = characterData != null ? characterData.maxHealth : 1000f;
            }
            facingDirection = isPlayer2 ? -1 : 1;
            UpdateFacingRotation();

            if (modelRoot != null)
            {
                initialModelLocalPos = modelRoot.localPosition;
                initialModelLocalRot = modelRoot.localRotation;
            }
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
            UpdateProceduralAnimation();
        }

        private void UpdateProceduralAnimation()
        {
            if (modelRoot == null) return;

            float t = Time.time * 4.5f;
            Vector3 targetPos = initialModelLocalPos;
            Vector3 targetEuler = Vector3.zero;

            switch (currentState)
            {
                case FighterState.Idle:
                    float breath = Mathf.Sin(t) * 0.035f;
                    targetPos += new Vector3(0, breath, 0);
                    targetEuler = new Vector3(Mathf.Sin(t * 0.5f) * 2f, 0, Mathf.Cos(t * 0.5f) * 1.5f);
                    break;

                case FighterState.WalkForward:
                    float stepFwd = Mathf.Sin(Time.time * 9f) * 0.06f;
                    targetPos += new Vector3(0, Mathf.Abs(stepFwd), stepFwd * 0.5f);
                    targetEuler = new Vector3(6f, 0, Mathf.Sin(Time.time * 9f) * 4f);
                    break;

                case FighterState.WalkBack:
                    float stepBack = Mathf.Sin(Time.time * 8f) * 0.04f;
                    targetPos += new Vector3(0, Mathf.Abs(stepBack), -stepBack * 0.3f);
                    targetEuler = new Vector3(-4f, 0, -Mathf.Sin(Time.time * 8f) * 3f);
                    break;

                case FighterState.Block:
                case FighterState.CrouchBlock:
                    targetPos += new Vector3(0, -0.1f, -0.15f);
                    targetEuler = new Vector3(8f, 0, 0);
                    break;

                case FighterState.Crouch:
                    targetPos += new Vector3(0, -0.35f, 0);
                    targetEuler = new Vector3(8f, 0, 0);
                    break;

                case FighterState.Jump:
                case FighterState.JumpPunch:
                case FighterState.JumpKick:
                    targetEuler = new Vector3(-10f, 0, 0);
                    break;

                case FighterState.LightPunch:
                case FighterState.HeavyPunch:
                    float punchProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.25f) * Mathf.PI);
                    targetPos += new Vector3(0, 0, punchProg * 0.45f);
                    targetEuler = new Vector3(punchProg * 12f, -punchProg * 15f, 0);
                    break;

                case FighterState.LightKick:
                case FighterState.HeavyKick:
                    float kickProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.3f) * Mathf.PI);
                    targetPos += new Vector3(0, kickProg * 0.15f, kickProg * 0.4f);
                    targetEuler = new Vector3(-kickProg * 18f, 0, kickProg * 10f);
                    break;

                case FighterState.SpecialMove:
                case FighterState.SuperMove:
                    float superProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.6f) * Mathf.PI);
                    targetPos += new Vector3(0, superProg * 0.25f, superProg * 0.65f);
                    targetEuler = new Vector3(superProg * 25f, superProg * 20f, 0);
                    break;

                case FighterState.Hurt:
                    float hurtProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.25f) * Mathf.PI);
                    targetPos += new Vector3(0, 0, -hurtProg * 0.35f);
                    targetEuler = new Vector3(-hurtProg * 22f, 0, 0);
                    break;

                case FighterState.Knockdown:
                case FighterState.Defeat:
                    targetPos += new Vector3(0, -0.85f, -0.4f);
                    targetEuler = new Vector3(-80f, 0, 0);
                    break;
            }

            modelRoot.localPosition = Vector3.Lerp(modelRoot.localPosition, targetPos, Time.deltaTime * 18f);
            modelRoot.localRotation = Quaternion.Slerp(modelRoot.localRotation, initialModelLocalRot * Quaternion.Euler(targetEuler), Time.deltaTime * 18f);
        }

        public void HandleInput(float horizontalInput, bool crouch, bool jump, bool lightPunch, bool heavyPunch, bool lightKick, bool heavyKick, bool special, bool superMove)
        {
            if (hitstunTimer > 0 || currentState == FighterState.Knockdown || currentState == FighterState.Defeat) return;

            // Bloqueio apenas se estiver sendo atacado ou em estado neutro com oponente ativo
            bool isAttacking = (currentState == FighterState.LightPunch || currentState == FighterState.HeavyPunch ||
                                currentState == FighterState.LightKick || currentState == FighterState.HeavyKick ||
                                currentState == FighterState.CrouchPunch || currentState == FighterState.CrouchKick ||
                                currentState == FighterState.JumpPunch || currentState == FighterState.JumpKick ||
                                currentState == FighterState.SpecialMove || currentState == FighterState.SuperMove);

            // Ataques com prioridade máxima
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

            if (lightPunch && !isAttacking) { ExecuteAttack(crouch ? FighterState.CrouchPunch : (isGrounded ? FighterState.LightPunch : FighterState.JumpPunch)); return; }
            if (heavyPunch && !isAttacking) { ExecuteAttack(isGrounded ? FighterState.HeavyPunch : FighterState.JumpPunch); return; }
            if (lightKick && !isAttacking) { ExecuteAttack(crouch ? FighterState.CrouchKick : (isGrounded ? FighterState.LightKick : FighterState.JumpKick)); return; }
            if (heavyKick && !isAttacking) { ExecuteAttack(isGrounded ? FighterState.HeavyKick : FighterState.JumpKick); return; }

            if (isAttacking) return;

            float speed = characterData != null ? characterData.moveSpeed : 7f;

            // Pulo e Movimento
            if (isGrounded)
            {
                if (jump)
                {
                    moveVelocity.y = characterData != null ? characterData.jumpForce : 14f;
                    moveVelocity.x = horizontalInput * speed;
                    ChangeState(FighterState.Jump);
                }
                else if (crouch)
                {
                    moveVelocity.x = 0;
                    ChangeState(FighterState.Crouch);
                }
                else if (Mathf.Abs(horizontalInput) > 0.05f)
                {
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
            else
            {
                // Controle aéreo / pulo diagonal
                if (Mathf.Abs(horizontalInput) > 0.05f)
                {
                    moveVelocity.x = horizontalInput * speed;
                }
            }
        }

        private void ExecuteAttack(FighterState state)
        {
            AttackData attack = attacks.Find(a => a.targetState == state);
            if (attack == null)
            {
                attack = new AttackData { targetState = state, damage = 60f, activeTime = 0.22f, startupTime = 0.06f, recoveryTime = 0.15f };
            }

            StartCoroutine(AttackCoroutine(attack));
        }

        private IEnumerator AttackCoroutine(AttackData attack)
        {
            ChangeState(attack.targetState);
            if (isGrounded) moveVelocity.x = 0;

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
                ChangeState(isGrounded ? FighterState.Idle : FighterState.Jump);
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

                // Efeitos Visuais & Impacto Cinematográfico (Hitstop & VFX)
                if (FightGame.Combat.HitstopManager.Instance != null)
                {
                    FightGame.Combat.HitstopManager.Instance.TriggerHitstop(attack.isHeavy ? 0.08f : 0.04f, attack.isHeavy);
                }

                if (FightGame.VFX.HitVFXManager.Instance != null)
                {
                    Vector3 hitPos = (transform.position + attacker.transform.position) * 0.5f + Vector3.up * 1.2f;
                    FightGame.VFX.HitVFXManager.Instance.SpawnHitSpark(hitPos, attack.isHeavy, attacker.characterData != null ? attacker.characterData.themeColor : Color.yellow);
                }
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

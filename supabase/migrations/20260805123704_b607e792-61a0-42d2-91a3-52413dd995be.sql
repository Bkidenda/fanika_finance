CREATE OR REPLACE FUNCTION public.process_due_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_subscription public.subscriptions%ROWTYPE;
  v_charge_date date;
  v_processed integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR v_subscription IN
    SELECT *
    FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND active = true
      AND account_id IS NOT NULL
      AND next_charge IS NOT NULL
      AND next_charge <= CURRENT_DATE
    FOR UPDATE SKIP LOCKED
  LOOP
    v_charge_date := v_subscription.next_charge;

    WHILE v_charge_date <= CURRENT_DATE LOOP
      IF v_subscription.last_charged IS NULL OR v_subscription.last_charged < v_charge_date THEN
        INSERT INTO public.expenses (
          user_id, date, amount, category, description, payment_method,
          is_emergency, account_id, occurred_at
        ) VALUES (
          auth.uid(), v_charge_date, v_subscription.amount, v_subscription.category,
          'Subscription renewal: ' || v_subscription.name, 'Automatic subscription',
          false, v_subscription.account_id, v_charge_date::timestamp with time zone
        );
        v_processed := v_processed + 1;
      END IF;

      v_subscription.last_charged := v_charge_date;
      v_charge_date := CASE v_subscription.cycle
        WHEN 'weekly' THEN v_charge_date + 7
        WHEN 'monthly' THEN (v_charge_date + INTERVAL '1 month')::date
        WHEN 'quarterly' THEN (v_charge_date + INTERVAL '3 months')::date
        WHEN 'annual' THEN (v_charge_date + INTERVAL '1 year')::date
        ELSE v_charge_date + INTERVAL '1 month'
      END;
    END LOOP;

    UPDATE public.subscriptions
    SET last_charged = v_subscription.last_charged,
        next_charge = v_charge_date
    WHERE id = v_subscription.id
      AND user_id = auth.uid();
  END LOOP;

  RETURN v_processed;
END;
$$;

REVOKE ALL ON FUNCTION public.process_due_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_due_subscriptions() TO authenticated;
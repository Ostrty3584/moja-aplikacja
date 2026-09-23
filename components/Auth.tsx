"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        async function getUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);
        }

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function register() {
        if (!email || password.length < 6) {
            alert(
                "Podaj e-mail i hasło mające minimum 6 znaków."
            );
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error(
                "Błąd rejestracji:",
                error
            );
            alert(error.message);
            return;
        }

        alert(
            "Konto utworzone. Sprawdź e-mail, jeśli wymagane jest potwierdzenie."
        );
    }

    async function login() {
        const { error } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (error) {
            console.error(
                "Błąd logowania:",
                error
            );
            alert("Nie udało się zalogować.");
            return;
        }

        setPassword("");
    }

    async function logout() {
        const { error } =
            await supabase.auth.signOut();

        if (error) {
            console.error(
                "Błąd wylogowania:",
                error
            );
            alert("Nie udało się wylogować.");
        }
    }

    if (user) {
        return (
            <section>
                <h2>Twoje konto</h2>

                <p>
                    Zalogowany jako:{" "}
                    <strong>{user.email}</strong>
                </p>

                <button
                    type="button"
                    onClick={logout}
                >
                    Wyloguj się
                </button>
            </section>
        );
    }

    return (
        <section>
            <h2>Logowanie</h2>

            <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />

            <button
                type="button"
                onClick={register}
            >
                Załóż konto
            </button>

            <button
                type="button"
                onClick={login}
            >
                Zaloguj się
            </button>
        </section>
    );
}
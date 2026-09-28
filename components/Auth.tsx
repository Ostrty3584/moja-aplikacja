"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [message, setMessage] = useState("");

    // =========================
    // SPRAWDZANIE SESJI
    // =========================

    useEffect(() => {
        async function getUser() {
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    if (
                        error.name !==
                        "AuthSessionMissingError"
                    ) {
                        console.warn(
                            "Problem z sesją:",
                            error.message
                        );
                    }

                    setUser(null);
                    return;
                }

                setUser(user);
            } catch {
                setUser(null);
            }
        }

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(
                    session?.user ?? null
                );
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // =========================
    // REJESTRACJA
    // =========================

    async function register() {
        setMessage("");

        const normalizedEmail =
            email.trim();

        if (
            !normalizedEmail ||
            password.length < 6
        ) {
            setMessage(
                "Podaj e-mail i hasło mające minimum 6 znaków."
            );
            return;
        }

        const { error } =
            await supabase.auth.signUp({
                email: normalizedEmail,
                password,
            });

        if (error) {
            if (
                error.message
                    .toLowerCase()
                    .includes(
                        "already registered"
                    )
            ) {
                setMessage(
                    "Ten e-mail jest już zarejestrowany. Spróbuj się zalogować."
                );
                return;
            }

            setMessage(
                `Nie udało się utworzyć konta: ${error.message}`
            );
            return;
        }

        setMessage(
            "Konto zostało utworzone."
        );

        setPassword("");
    }

    // =========================
    // LOGOWANIE
    // =========================

    async function login() {
        setMessage("");

        const normalizedEmail =
            email.trim();

        if (
            !normalizedEmail ||
            password.length < 6
        ) {
            setMessage(
                "Podaj poprawny e-mail i hasło o długości co najmniej 6 znaków."
            );
            return;
        }

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

        if (error) {
            if (
                error.message
                    .toLowerCase()
                    .includes(
                        "invalid login credentials"
                    )
            ) {
                setMessage(
                    "Nieprawidłowy e-mail lub hasło."
                );
                return;
            }

            setMessage(
                `Nie udało się zalogować: ${error.message}`
            );
            return;
        }

        setUser(data.user);

        setMessage("");

        setPassword("");
    }

    // =========================
    // WYLOGOWANIE
    // =========================

    async function logout() {
        const { error } =
            await supabase.auth.signOut();

        if (error) {
            setMessage(
                "Nie udało się wylogować."
            );
            return;
        }

        setUser(null);
        setEmail("");
        setPassword("");
        setMessage("");
    }

    // =========================
    // ZALOGOWANY UŻYTKOWNIK
    // =========================

    if (user) {
        return (
            <section>
                <h2>
                    Twoje konto
                </h2>

                <p>
                    Zalogowany jako:{" "}
                    <strong>
                        {user.email}
                    </strong>
                </p>

                <button
                    type="button"
                    onClick={logout}
                >
                    Wyloguj się
                </button>

                {message && (
                    <p>{message}</p>
                )}
            </section>
        );
    }

    // =========================
    // LOGOWANIE / REJESTRACJA
    // =========================

    return (
        <section>
            <h2>Logowanie</h2>

            <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) =>
                    setEmail(
                        e.target.value
                    )
                }
            />

            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) =>
                    setPassword(
                        e.target.value
                    )
                }
            />

            {message && (
                <p>{message}</p>
            )}

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
function solve(s, ops) {
    const dp = []
    for (let step = 1; step <= s.length; step++) {
        dp[step] = []
        for (let start = 0; start + step - 1 < s.length; start++) {
            if (step === 1) {
                dp[step][start] = [s[start] === 't' ? 1 : 0, s[start] === 'f' ? 1 : 0]
                continue
            }

            let ct = 0
            let cf = 0
            const end = start + step - 1
            for (let mid = start; mid < end; mid++) {
                // [start, mid], (mid, end]
                const [t1, f1] = dp[mid - start + 1][start]
                const [t2, f2] = dp[end - mid][mid + 1]
                switch (ops[mid]) {
                    case '^':
                        ct += t1 * f2 + t2 * f1
                        cf += t1 * t2 + f1 * f2
                        break
                    case '&':
                        ct += t1 * t2
                        cf += t1 * f2 + t2 * f1 + f1 * f2
                        break
                    case '|':
                        ct += t1 * f2 + t2 * f1 + t1 * t2
                        cf += f1 * f2
                        break
                    default:
                        break
                }
            }

            dp[step][start] = [ct, cf]
        }
    }
    return dp[s.length][0][0]
}

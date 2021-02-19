#include <stdio.h>

char a[4][7] = {"Common", "Point", "Boost", "Better"};
/* Insert type here */char (*b[4])[7] = {a+3, a+1, a, a+2};

/* Insert type here */char (*(*c(void))[4])[7]
{
    return &b;
}

/* Insert type here */char (**d(void))[7]
{
    // c() means &b
    // [1] means &b + sizeof(b), which is just out of `b`
    // -3 means moving backwards, which points to b[1], as well as points to a+1
    return c()[1] - 3;
}

char buf[256];

char *pointer_monster(/* Insert type here */char (**f(void))[7])
{
    int len;
    
    // f(), which points to a+1
    // [0], equals to a+1
    // *, address of "Point"
    len  = sprintf(buf, "%s", *f()[/* ? */0]);
    // (**f)(), as well as f()
    // -1, which points to b[0], as well as points to a+3
    // [0], equals to a+3
    // *, address of "Better"
    // note the format string here contains a space
    len += sprintf(buf + len, "%s ", *((**f)()-1)[0]+/* ? */4);
    // *f(), equals to a+1
    // remind that C strings end with a \0
    len += sprintf(buf + len, "%s", (*f())[/* ? */0]-4);
    // f()[1], points to a
    len += sprintf(buf + len, "%s", f()[/* ? */1][2]+3);
    len += sprintf(buf + len, "%s", *((**f)()-1)[0]+/* ? */4);
    return buf;
}

// When submitting, please remove inline comments
// Below is Sample Tests

#include <criterion/criterion.h>

// When ready, uncomment the following lines to test your code

extern /* Insert type here */ char *pointer_monster(char (**f(void))[7]);
extern /* Insert type here */ char (**d(void))[7];

Test(Pointer_Monster, Basic_Test)
{
    char *result = pointer_monster(d);
    cr_assert_str_eq(result, "Pointer monster",
        "Failed to produce \"Pointer monster\"; result was: %s", result);
    cr_assert(1);
}

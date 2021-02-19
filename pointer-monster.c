#include <stdio.h>

char a[4][7] = {"Common", "Point", "Boost", "Better"};
/* Insert type here */char (*b[4])[7] = {a+3, a+1, a, a+2};

/* Insert type here */char (*(*c(void))[4])[7]
{
    return &b;
}

/* Insert type here */char (**d(void))[7]
{
    return c()[1] - 3;
}

char buf[256];

char *pointer_monster(/* Insert type here */char (**f(void))[7])
{
    int len;
    
    len  = sprintf(buf, "%s", *f()[/* ? */0]);
    len += sprintf(buf + len, "%s ", *((**f)()-1)[0]+/* ? */4);
    len += sprintf(buf + len, "%s", (*f())[/* ? */0]-4);
    len += sprintf(buf + len, "%s", f()[/* ? */1][2]+3);
    len += sprintf(buf + len, "%s", *((**f)()-1)[0]+/* ? */4);
    return buf;
}

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

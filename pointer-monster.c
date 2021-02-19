#include <stdio.h>

char a[4][7] = {"Common", "Point", "Boost", "Better"};
/* Insert type here */ b[4] = {a+3, a+1, a, a+2};

/* Insert type here */ c(void)
{
    return &b;
}

/* Insert type here */ d(void)
{
    return c()[1] - 3;
}

char buf[256];

char *pointer_monster(/* Insert type here */ f)
{
    int len;
    
    len  = sprintf(buf, "%s", *f()[/* ? */]);
    len += sprintf(buf + len, "%s ", *((**f)()-1)[0]+/* ? */);
    len += sprintf(buf + len, "%s", (*f())[/* ? */]-4);
    len += sprintf(buf + len, "%s", f()[/* ? */][2]+3);
    len += sprintf(buf + len, "%s", *((**f)()-1)[0]+/* ? */);
    return buf;
}

// Below is Sample Tests

#include <criterion/criterion.h>

// When ready, uncomment the following lines to test your code

//extern /* Insert type here */ pointer_monster;
//extern /* Insert type here */ d;

Test(Pointer_Monster, Basic_Test)
{
    /*
    char *result = pointer_monster(d);
    cr_assert_str_eq(result, "Pointer monster",
        "Failed to produce \"Pointer monster\"; result was: %s", result);
    */
    cr_assert(1);
}

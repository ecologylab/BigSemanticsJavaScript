var StringCleaner = {};

/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
StringCleaner.toDisplayCase = function(string)
{  
  var strings = string.split('_');
  var display = "";
  for (var s in strings)
  {
    display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
  }
  return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
StringCleaner.removeLineBreaksAndCrazies = function(string)
{
  string = string.replace(/(\r\n|\n|\r)/gm," ");  
  var result = "";
  for (var i = 0; i < string.length; i++)
  {
    if (string.charCodeAt(i) < 128)
    {
      result += string.charAt(i);
    }
  }
  return result;
}

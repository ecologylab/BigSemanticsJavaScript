/**
 * For positive integers only,
 */

isPrime = function (number){
	
	if (number <= 0) return false;
	//Case 1 and 2
	if ((number == 1) || (number == 2)) 
		return true;
	//Covers Evens
	if (number % 2 == 0) 
		return false;
	//Odd numbers greater than 2
	for (i = 3; i < ((number / 2) | 0); i = i + 2){
		if (number % i == 0) 
			return false;
	}
	return true;
}